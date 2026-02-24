<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProposalStatus;
use App\Models\DetailPengajuan;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProposalService
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * Create a new proposal with its details and initialize the approval chain
     *
     * @param array{
     *     unit: string,
     *     tahun: string,
     *     tanggal: string,
     *     perihal: string,
     *     keperluan: ?string,
     *     catatan: ?string,
     *     details: array<int, array{
     *         detail_mata_anggaran_id: int,
     *         mata_anggaran_id: ?int,
     *         sub_mata_anggaran_id: ?int,
     *         uraian: string,
     *         jumlah: float,
     *         satuan: ?string,
     *         harga_satuan: ?float,
     *     }>
     * } $data
     */
    public function create(array $data, User $user): PengajuanAnggaran
    {
        return DB::transaction(function () use ($data, $user) {
            $noSurat = $this->generateNoSurat($data['unit'], $data['tahun']);

            $pengajuan = PengajuanAnggaran::create([
                'no_surat' => $noSurat,
                'unit' => $data['unit'],
                'tahun' => $data['tahun'],
                'tanggal' => $data['tanggal'],
                'perihal' => $data['perihal'],
                'keperluan' => $data['keperluan'] ?? null,
                'catatan' => $data['catatan'] ?? null,
                'status_proses' => ProposalStatus::Draft->value,
                'created_by' => $user->id,
            ]);

            if (!empty($data['details'])) {
                $this->addDetails($pengajuan, $data['details']);
            }

            // Initialize the approval chain
            $this->approvalService->initializeApprovalChain($pengajuan);

            return $pengajuan->fresh(['details', 'approvals']);
        });
    }

    /**
     * Generate sequential surat number
     * Format: {count}/{unit}/{month-roman}/{year}
     */
    public function generateNoSurat(string $unit, string $tahun): string
    {
        $currentMonth = (int) now()->format('m');
        $romanMonths = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];
        $romanMonth = $romanMonths[$currentMonth];

        // Count existing proposals for this unit in this year
        $count = PengajuanAnggaran::where('unit', $unit)
            ->where('tahun', $tahun)
            ->count();

        $nextNumber = str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);

        return "{$nextNumber}/{$unit}/{$romanMonth}/{$tahun}";
    }

    /**
     * Submit a draft proposal for approval
     * Validates the proposal has at least one detail item before submitting
     */
    public function submit(PengajuanAnggaran $pengajuan): void
    {
        if ($pengajuan->status_proses !== ProposalStatus::Draft->value
            && $pengajuan->status_proses !== ProposalStatus::Revised->value) {
            throw new \RuntimeException('Pengajuan hanya bisa disubmit dari status draft atau revisi.');
        }

        $detailCount = $pengajuan->details()->count();

        if ($detailCount === 0) {
            throw new \RuntimeException('Pengajuan harus memiliki minimal satu detail item.');
        }

        // If this is a resubmission after revision, reset the approval chain
        if ($pengajuan->status_proses === ProposalStatus::Revised->value) {
            $this->approvalService->resubmit($pengajuan);
        } else {
            $this->approvalService->initializeApprovalChain($pengajuan);
        }
    }

    /**
     * Add detail items to a proposal
     *
     * @param array<int, array{
     *     detail_mata_anggaran_id: int,
     *     mata_anggaran_id: ?int,
     *     sub_mata_anggaran_id: ?int,
     *     uraian: string,
     *     jumlah: float,
     *     satuan: ?string,
     *     harga_satuan: ?float,
     * }> $details
     */
    public function addDetails(PengajuanAnggaran $pengajuan, array $details): void
    {
        $totalJumlah = 0.0;

        foreach ($details as $detail) {
            $jumlah = (float) $detail['jumlah'];

            // If harga_satuan is provided, calculate jumlah from qty * harga_satuan
            if (isset($detail['harga_satuan']) && $detail['harga_satuan'] > 0) {
                $qty = isset($detail['qty']) ? (float) $detail['qty'] : 1.0;
                $jumlah = $qty * (float) $detail['harga_satuan'];
            }

            DetailPengajuan::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'detail_mata_anggaran_id' => $detail['detail_mata_anggaran_id'],
                'mata_anggaran_id' => $detail['mata_anggaran_id'] ?? null,
                'sub_mata_anggaran_id' => $detail['sub_mata_anggaran_id'] ?? null,
                'uraian' => $detail['uraian'],
                'jumlah' => $jumlah,
                'satuan' => $detail['satuan'] ?? null,
                'harga_satuan' => $detail['harga_satuan'] ?? null,
                'qty' => $detail['qty'] ?? null,
            ]);

            $totalJumlah += $jumlah;
        }

        // Update total on the proposal
        $pengajuan->update([
            'total_jumlah' => $pengajuan->total_jumlah + $totalJumlah,
        ]);
    }
}
