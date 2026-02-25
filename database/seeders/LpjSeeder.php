<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\LpjStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\Lpj;
use App\Models\LpjValidation;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class LpjSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    private string $tahunDoc = '2026';

    private int $nomorUrut = 100;

    private int $lpjNomor = 1;

    public function run(): void
    {
        $staffKeuangan = User::where('email', 'staff.keuangan@sianggar.test')->first();
        if (! $staffKeuangan) {
            return;
        }

        // =====================================================================
        // Step 1: Create additional Paid pengajuan as LPJ sources
        // =====================================================================
        $paidSd = $this->createPaidPengajuan('sd@sianggar.test', 'SD', 'Pelatihan Guru Kurikulum Baru', 15_000_000, ReferenceType::Education);
        $paidRa = $this->createPaidPengajuan('ra@sianggar.test', 'RA', 'Wisuda Santriwan/Santriwati', 20_000_000, ReferenceType::Education);
        $paidSma = $this->createPaidPengajuan('sma33@sianggar.test', 'SMA33', 'Olimpiade Sains Nasional', 12_000_000, ReferenceType::Education);
        $paidSdm = $this->createPaidPengajuan('sdm@sianggar.test', null, 'Pelatihan Leadership Staff', 18_000_000, ReferenceType::HrGeneral, 'substansi');
        $paidSekretariat = $this->createPaidPengajuan('staff.sekretariat@sianggar.test', null, 'Rapat Kerja Internal', 10_000_000, ReferenceType::Secretariat, 'substansi');

        // Existing Paid pengajuan with need_lpj=true
        $existingStebank = PengajuanAnggaran::where('nama_pengajuan', 'Pelatihan Kewirausahaan')
            ->where('status_proses', ProposalStatus::Paid)
            ->first();
        $existingUmum = PengajuanAnggaran::where('nama_pengajuan', 'Pengecatan Gedung')
            ->where('status_proses', ProposalStatus::Paid)
            ->first();

        // =====================================================================
        // Step 2: Create 7 LPJ records at various statuses
        // =====================================================================

        // LPJ 1: Draft
        if ($paidSd) {
            $this->createLpj(
                pengajuan: $paidSd,
                status: LpjStatus::Draft,
                currentStage: null,
                referenceType: null,
                inputRealisasi: 0,
                approvals: [],
            );
        }

        // LPJ 2: Submitted (waiting for StaffKeuangan validation)
        if ($paidRa) {
            $this->createLpj(
                pengajuan: $paidRa,
                status: LpjStatus::Submitted,
                currentStage: ApprovalStage::StaffKeuangan,
                referenceType: null,
                inputRealisasi: 18_500_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
                ],
            );
        }

        // LPJ 3: Validated (waiting for middle approver — Direktur for Education)
        if ($paidSma) {
            $this->createLpj(
                pengajuan: $paidSma,
                status: LpjStatus::Validated,
                currentStage: ApprovalStage::Direktur,
                referenceType: ReferenceType::Education,
                inputRealisasi: 11_200_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                    ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
                ],
                validationData: [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::Education,
                    'notes' => 'Dokumen LPJ lengkap, diteruskan ke Direktur.',
                ],
            );
        }

        // LPJ 4: ApprovedByMiddle (waiting for Keuangan — final stage)
        if ($existingStebank) {
            $this->createLpj(
                pengajuan: $existingStebank,
                status: LpjStatus::ApprovedByMiddle,
                currentStage: ApprovalStage::Keuangan,
                referenceType: ReferenceType::Education,
                inputRealisasi: 11_500_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                    ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                    ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
                ],
                validationData: [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::Education,
                    'notes' => 'Semua dokumen sesuai.',
                ],
            );
        }

        // LPJ 5: Approved (fully done — HrGeneral route)
        if ($existingUmum) {
            $this->createLpj(
                pengajuan: $existingUmum,
                status: LpjStatus::Approved,
                currentStage: null,
                referenceType: ReferenceType::HrGeneral,
                inputRealisasi: 33_000_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                    ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                    ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ],
                validationData: [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::HrGeneral,
                    'notes' => 'LPJ diterima dan disetujui.',
                ],
            );
        }

        // LPJ 6: Revised (revision requested by KabagSdmUmum)
        if ($paidSdm) {
            $this->createLpj(
                pengajuan: $paidSdm,
                status: LpjStatus::Revised,
                currentStage: ApprovalStage::KabagSdmUmum,
                referenceType: ReferenceType::HrGeneral,
                inputRealisasi: 17_000_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                    ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Revised, 'approver' => 'kabag@sianggar.test', 'notes' => 'Bukti kwitansi pelatihan kurang lengkap, mohon dilengkapi.'],
                ],
                validationData: [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => false,
                    'has_financial_report' => true,
                    'has_receipts' => false,
                    'reference_type' => ReferenceType::HrGeneral,
                    'notes' => 'Narrative report dan bukti kwitansi belum lengkap.',
                ],
            );
        }

        // LPJ 7: Rejected (rejected by KabagSekretariat)
        if ($paidSekretariat) {
            $this->createLpj(
                pengajuan: $paidSekretariat,
                status: LpjStatus::Rejected,
                currentStage: null,
                referenceType: ReferenceType::Secretariat,
                inputRealisasi: 9_500_000,
                approvals: [
                    ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                    ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Rejected, 'approver' => 'sekretariat@sianggar.test', 'notes' => 'Realisasi melebihi anggaran tanpa persetujuan.'],
                ],
                validationData: [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::Secretariat,
                    'notes' => 'Dokumen lengkap.',
                ],
            );
        }
    }

    // =========================================================================
    // Helper: Create a fully-paid Pengajuan for LPJ source
    // =========================================================================

    private function createPaidPengajuan(
        string $userEmail,
        ?string $unitKode,
        string $nama,
        float $total,
        ReferenceType $referenceType,
        string $submitterType = 'unit',
    ): ?PengajuanAnggaran {
        $user = User::where('email', $userEmail)->first();
        if (! $user) {
            return null;
        }

        $unit = $unitKode ? Unit::where('kode', $unitKode)->first() : null;
        $noSurat = sprintf('PA/%s/%s/%03d', $this->tahunDoc, strtoupper(substr($unitKode ?? 'SUB', 0, 3)), $this->nomorUrut++);

        $pengajuan = PengajuanAnggaran::create([
            'user_id' => $user->id,
            'unit_id' => $unit?->id,
            'tahun' => $this->tahun,
            'nomor_pengajuan' => $noSurat,
            'perihal' => $nama,
            'nama_pengajuan' => $nama,
            'no_surat' => $noSurat,
            'tempat' => 'Kampus Al-Azhar',
            'waktu_kegiatan' => Carbon::now()->subDays(rand(10, 30))->format('Y-m-d'),
            'unit' => $unit?->nama ?? $unitKode ?? 'Substansi',
            'jumlah_pengajuan_total' => $total,
            'status_proses' => ProposalStatus::Paid,
            'current_approval_stage' => null,
            'submitter_type' => $submitterType,
            'amount_category' => AmountCategory::fromAmount($total),
            'reference_type' => $referenceType,
            'need_lpj' => true,
            'approved_amount' => $total,
            'no_voucher' => sprintf('VCR/%s/%03d', $this->tahunDoc, $this->nomorUrut),
            'status_payment' => 'paid',
            'paid_at' => Carbon::now()->subDays(rand(5, 15)),
        ]);

        // Create detail item
        $dma = DetailMataAnggaran::where('tahun', '2026/2027')
            ->when($unit, fn ($q) => $q->where('unit_id', $unit->id))
            ->first();

        if ($dma) {
            DetailPengajuan::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'detail_mata_anggaran_id' => $dma->id,
                'mata_anggaran_id' => $dma->mata_anggaran_id,
                'sub_mata_anggaran_id' => $dma->sub_mata_anggaran_id,
                'uraian' => $nama,
                'volume' => 1,
                'satuan' => 'paket',
                'harga_satuan' => $total,
                'jumlah' => $total,
            ]);
        }

        // Create full approval chain (all approved)
        $stages = $submitterType === 'unit'
            ? [
                ['stage' => ApprovalStage::StaffDirektur, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'approver' => 'keuangan@sianggar.test'],
            ]
            : [
                ['stage' => ApprovalStage::StaffKeuangan, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'approver' => 'keuangan@sianggar.test'],
            ];

        $order = 1;
        foreach ($stages as $s) {
            $approver = User::where('email', $s['approver'])->first();
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => $s['stage'],
                'stage_order' => $order++,
                'status' => ApprovalStatus::Approved,
                'approved_by' => $approver?->id,
                'approved_at' => Carbon::now()->subDays(rand(1, 10)),
            ]);
        }

        return $pengajuan;
    }

    // =========================================================================
    // Helper: Create an LPJ record
    // =========================================================================

    private function createLpj(
        PengajuanAnggaran $pengajuan,
        LpjStatus $status,
        ?ApprovalStage $currentStage,
        ?ReferenceType $referenceType,
        float $inputRealisasi,
        array $approvals,
        ?array $validationData = null,
    ): void {
        $staffKeuangan = User::where('email', 'staff.keuangan@sianggar.test')->first();
        $noSurat = sprintf('LPJ/%s/%03d', $this->tahunDoc, $this->lpjNomor++);
        $isValidated = in_array($status, [LpjStatus::Validated, LpjStatus::ApprovedByMiddle, LpjStatus::Approved]);

        $lpj = Lpj::create([
            'pengajuan_anggaran_id' => $pengajuan->id,
            'unit' => $pengajuan->unit,
            'no_surat' => $status !== LpjStatus::Draft ? $noSurat : null,
            'mata_anggaran' => 'Belanja Kegiatan',
            'perihal' => 'LPJ ' . $pengajuan->nama_pengajuan,
            'no_mata_anggaran' => 'MA-03',
            'jumlah_pengajuan_total' => $pengajuan->jumlah_pengajuan_total,
            'tgl_kegiatan' => Carbon::now()->subDays(rand(5, 20))->format('Y-m-d'),
            'input_realisasi' => $inputRealisasi,
            'deskripsi_singkat' => 'Laporan pertanggungjawaban kegiatan ' . $pengajuan->nama_pengajuan,
            'proses' => $status,
            'current_approval_stage' => $currentStage?->value,
            'revision_requested_stage' => $status === LpjStatus::Revised ? $currentStage?->value : null,
            'tahun' => $this->tahun,
            'ditujukan' => 'Ketua Yayasan',
            'budget_released' => $status === LpjStatus::Approved,
            'reference_type' => $referenceType,
            'validated_at' => $isValidated ? Carbon::now()->subDays(rand(1, 5)) : null,
            'validated_by' => $isValidated ? $staffKeuangan?->id : null,
            'validation_notes' => $validationData['notes'] ?? null,
        ]);

        // Create LpjValidation record
        if ($validationData) {
            LpjValidation::create([
                'lpj_id' => $lpj->id,
                'validated_by' => $staffKeuangan?->id,
                'has_activity_identity' => $validationData['has_activity_identity'],
                'has_cover_letter' => $validationData['has_cover_letter'],
                'has_narrative_report' => $validationData['has_narrative_report'],
                'has_financial_report' => $validationData['has_financial_report'],
                'has_receipts' => $validationData['has_receipts'],
                'reference_type' => $validationData['reference_type'],
                'notes' => $validationData['notes'],
            ]);
        }

        // Create approval records
        $stageOrder = 1;
        foreach ($approvals as $approval) {
            $approver = isset($approval['approver'])
                ? User::where('email', $approval['approver'])->first()
                : null;

            Approval::create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => $approval['stage'],
                'stage_order' => $stageOrder++,
                'status' => $approval['status'],
                'approved_by' => $approver?->id,
                'notes' => $approval['notes'] ?? null,
                'approved_at' => $approval['status'] !== ApprovalStatus::Pending
                    ? Carbon::now()->subDays(rand(1, 5))
                    : null,
            ]);
        }
    }
}
