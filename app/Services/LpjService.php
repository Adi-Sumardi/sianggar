<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\LpjStatus;
use App\Enums\ProposalStatus;
use App\Models\DetailLpj;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LpjService
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * Create a new LPJ (Laporan Pertanggungjawaban)
     *
     * @param array{
     *     pengajuan_anggaran_id: ?int,
     *     unit: string,
     *     tahun: string,
     *     tanggal: string,
     *     perihal: string,
     *     keterangan: ?string,
     *     details: ?array<int, array{
     *         detail_mata_anggaran_id: int,
     *         mata_anggaran_id: ?int,
     *         sub_mata_anggaran_id: ?int,
     *         uraian: string,
     *         jumlah_pengajuan: float,
     *         jumlah_realisasi: float,
     *         jumlah_sisa: float,
     *         bukti_file: ?string,
     *     }>
     * } $data
     */
    public function create(array $data, User $user): Lpj
    {
        return DB::transaction(function () use ($data, $user) {
            $lpj = Lpj::create([
                'pengajuan_anggaran_id' => $data['pengajuan_anggaran_id'] ?? null,
                'unit' => $data['unit'],
                'tahun' => $data['tahun'],
                'tanggal' => $data['tanggal'],
                'perihal' => $data['perihal'],
                'keterangan' => $data['keterangan'] ?? null,
                'status_proses' => LpjStatus::Draft->value,
                'created_by' => $user->id,
            ]);

            // If linked to a pengajuan, auto-populate details from the proposal
            if (!empty($data['pengajuan_anggaran_id'])) {
                $this->populateFromPengajuan($lpj, (int) $data['pengajuan_anggaran_id']);
            }

            // If manual details are provided, add them
            if (!empty($data['details'])) {
                $this->addDetails($lpj, $data['details']);
            }

            return $lpj->fresh(['details', 'pengajuanAnggaran']);
        });
    }

    /**
     * Submit an LPJ for approval
     */
    public function submit(Lpj $lpj): void
    {
        if ($lpj->status_proses !== LpjStatus::Draft->value
            && $lpj->status_proses !== LpjStatus::Revised->value) {
            throw new \RuntimeException('LPJ hanya bisa disubmit dari status draft atau revisi.');
        }

        $detailCount = $lpj->details()->count();

        if ($detailCount === 0) {
            throw new \RuntimeException('LPJ harus memiliki minimal satu detail item.');
        }

        // If this is a resubmission after revision, reset the approval chain
        if ($lpj->status_proses === LpjStatus::Revised->value) {
            $this->approvalService->resubmit($lpj);
        } else {
            $this->approvalService->initializeApprovalChain($lpj);
        }
    }

    /**
     * Populate LPJ detail items from the linked pengajuan anggaran
     */
    private function populateFromPengajuan(Lpj $lpj, int $pengajuanId): void
    {
        $pengajuan = PengajuanAnggaran::with('details')->findOrFail($pengajuanId);

        foreach ($pengajuan->details as $detailPengajuan) {
            DetailLpj::create([
                'lpj_id' => $lpj->id,
                'detail_pengajuan_id' => $detailPengajuan->id,
                'detail_mata_anggaran_id' => $detailPengajuan->detail_mata_anggaran_id,
                'mata_anggaran_id' => $detailPengajuan->mata_anggaran_id,
                'sub_mata_anggaran_id' => $detailPengajuan->sub_mata_anggaran_id,
                'uraian' => $detailPengajuan->uraian,
                'jumlah_pengajuan' => $detailPengajuan->jumlah,
                'jumlah_realisasi' => 0,
                'jumlah_sisa' => $detailPengajuan->jumlah,
            ]);
        }
    }

    /**
     * Add detail items to an LPJ
     *
     * @param array<int, array{
     *     detail_mata_anggaran_id: int,
     *     mata_anggaran_id: ?int,
     *     sub_mata_anggaran_id: ?int,
     *     uraian: string,
     *     jumlah_pengajuan: float,
     *     jumlah_realisasi: float,
     *     jumlah_sisa: float,
     *     bukti_file: ?string,
     * }> $details
     */
    private function addDetails(Lpj $lpj, array $details): void
    {
        $totalPengajuan = 0.0;
        $totalRealisasi = 0.0;
        $totalSisa = 0.0;

        foreach ($details as $detail) {
            $jumlahPengajuan = (float) $detail['jumlah_pengajuan'];
            $jumlahRealisasi = (float) $detail['jumlah_realisasi'];
            $jumlahSisa = $jumlahPengajuan - $jumlahRealisasi;

            DetailLpj::create([
                'lpj_id' => $lpj->id,
                'detail_mata_anggaran_id' => $detail['detail_mata_anggaran_id'],
                'mata_anggaran_id' => $detail['mata_anggaran_id'] ?? null,
                'sub_mata_anggaran_id' => $detail['sub_mata_anggaran_id'] ?? null,
                'uraian' => $detail['uraian'],
                'jumlah_pengajuan' => $jumlahPengajuan,
                'jumlah_realisasi' => $jumlahRealisasi,
                'jumlah_sisa' => $jumlahSisa,
                'bukti_file' => $detail['bukti_file'] ?? null,
            ]);

            $totalPengajuan += $jumlahPengajuan;
            $totalRealisasi += $jumlahRealisasi;
            $totalSisa += $jumlahSisa;
        }

        $lpj->update([
            'total_pengajuan' => $totalPengajuan,
            'total_realisasi' => $totalRealisasi,
            'total_sisa' => $totalSisa,
        ]);
    }
}
