<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\AmountEditLog;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\Discussion;
use App\Models\DiscussionMessage;
use App\Models\FinanceValidation;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\Rapbs;
use App\Models\RevisionComment;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AdditionalDataSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    private string $tahunDoc = '2026';

    private int $nomorUrut = 200;

    public function run(): void
    {
        // =====================================================================
        // 4a. Additional Pengajuan (6 records — Rejected, RevisionRequired, Paid)
        // =====================================================================
        $this->seedAdditionalPengajuan();

        // =====================================================================
        // 4b. FinanceValidation (8 records)
        // =====================================================================
        $this->seedFinanceValidation();

        // =====================================================================
        // 4c. Discussion + Messages (4 discussions, ~12 messages)
        // =====================================================================
        $this->seedDiscussions();

        // =====================================================================
        // 4d. AmountEditLog (4 records)
        // =====================================================================
        $this->seedAmountEditLogs();

        // =====================================================================
        // 4e. RevisionComment (12 records)
        // =====================================================================
        $this->seedRevisionComments();
    }

    // =========================================================================
    // 4a. Additional Pengajuan — gap scenarios
    // =========================================================================

    private function seedAdditionalPengajuan(): void
    {
        // 1. PG — Rejected at Direktur
        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unitKode: 'PG',
            nama: 'Pengadaan AC Ruangan',
            total: 25_000_000,
            status: ProposalStatus::Rejected,
            currentStage: null,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Rejected, 'approver' => 'direktur@sianggar.test', 'notes' => 'Anggaran AC belum masuk prioritas tahun ini.'],
            ],
        );

        // 2. SMA33 — Rejected at Keuangan
        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unitKode: 'SMA33',
            nama: 'Pengadaan Sound System',
            total: 45_000_000,
            status: ProposalStatus::Rejected,
            currentStage: null,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Rejected, 'approver' => 'keuangan@sianggar.test', 'notes' => 'Alokasi anggaran modal sudah melebihi batas.'],
            ],
        );

        // 3. SDM — RevisionRequired at KabagSdmUmum
        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unitKode: null,
            nama: 'Pelatihan Soft Skills',
            total: 8_000_000,
            status: ProposalStatus::RevisionRequired,
            currentStage: ApprovalStage::KabagSdmUmum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Revised, 'approver' => 'kabag@sianggar.test', 'notes' => 'Mohon perjelas sasaran peserta dan materi pelatihan.'],
            ],
        );

        // 4. Staf Sekretariat — RevisionRequired at Sekretaris
        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unitKode: null,
            nama: 'Pengadaan Filling Cabinet',
            total: 12_000_000,
            status: ProposalStatus::RevisionRequired,
            currentStage: ApprovalStage::KabagSekretariat,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Revised, 'approver' => 'sekretariat@sianggar.test', 'notes' => 'Spesifikasi dan jumlah unit perlu disesuaikan.'],
            ],
        );

        // 5. Asrama — Paid (full approval chain, need_lpj=true)
        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unitKode: null,
            nama: 'Renovasi Dapur Asrama',
            total: 30_000_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/ASR/001',
        );

        // 6. LAZ — Paid (full approval chain, need_lpj=true)
        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unitKode: null,
            nama: 'Program Pemberdayaan Ekonomi Umat',
            total: 40_000_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/LAZ/001',
        );
    }

    // =========================================================================
    // 4b. FinanceValidation — for pengajuan past StaffKeuangan
    // =========================================================================

    private function seedFinanceValidation(): void
    {
        $staffKeuangan = User::where('email', 'staff.keuangan@sianggar.test')->first();
        if (! $staffKeuangan) {
            return;
        }

        $validations = [
            // [nama_pengajuan, reference_type, amount_category, need_lpj]
            ['Kegiatan Parent Meeting', ReferenceType::Education, AmountCategory::Low, false],
            ['Festival Anak Sehat', ReferenceType::Education, AmountCategory::High, true],
            ['Pelatihan Kurikulum Merdeka', ReferenceType::Education, AmountCategory::Low, false],
            ['Renovasi Laboratorium', ReferenceType::Education, AmountCategory::High, true],
            ['Pemeliharaan Gedung Asrama', ReferenceType::HrGeneral, AmountCategory::High, true],
            ['Penelitian Kurikulum', ReferenceType::Secretariat, AmountCategory::High, true],
            ['Pelatihan Leadership Guru', ReferenceType::HrGeneral, AmountCategory::High, true],
            ['Workshop Digital Marketing', ReferenceType::Education, AmountCategory::Low, false],
        ];

        foreach ($validations as [$nama, $refType, $amountCat, $needLpj]) {
            $pengajuan = PengajuanAnggaran::where('nama_pengajuan', $nama)->first();
            if (! $pengajuan) {
                continue;
            }

            // Skip if already has validation
            if (FinanceValidation::where('pengajuan_anggaran_id', $pengajuan->id)->exists()) {
                continue;
            }

            FinanceValidation::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'validated_by' => $staffKeuangan->id,
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => $refType,
                'amount_category' => $amountCat,
                'need_lpj' => $needLpj,
                'notes' => null,
            ]);
        }
    }

    // =========================================================================
    // 4c. Discussion + Messages — for pengajuan at/past Ketum
    // =========================================================================

    private function seedDiscussions(): void
    {
        $ketum = User::where('email', 'ketum@sianggar.test')->first();
        $sekretaris = User::where('email', 'sekretaris@sianggar.test')->first();

        $discussions = [
            [
                'pengajuan_nama' => 'Wisuda Santri',
                'status' => 'open',
                'messages' => [
                    ['user' => 'ketum@sianggar.test', 'message' => 'Apakah anggaran wisuda sudah termasuk biaya dekorasi?'],
                    ['user' => 'ra@sianggar.test', 'message' => 'Sudah termasuk, Pak. Detail ada di lampiran halaman 3.'],
                    ['user' => 'ketum@sianggar.test', 'message' => 'Baik, saya perlu konfirmasi ulang dengan bagian keuangan dulu.'],
                ],
            ],
            [
                'pengajuan_nama' => 'Renovasi Lab Komputer',
                'status' => 'open',
                'messages' => [
                    ['user' => 'sekretaris@sianggar.test', 'message' => 'Vendor yang dipilih sudah sesuai prosedur pengadaan?'],
                    ['user' => 'sd@sianggar.test', 'message' => 'Sudah, kami mengikuti proses procurement 3 penawaran sesuai SOP.'],
                ],
            ],
            [
                'pengajuan_nama' => 'Pembangunan Ruang Kelas',
                'status' => 'closed',
                'messages' => [
                    ['user' => 'ketum@sianggar.test', 'message' => 'Total 150 juta ini sudah termasuk RAB lengkap?'],
                    ['user' => 'smp55@sianggar.test', 'message' => 'Iya Pak, sudah termasuk material, tenaga kerja, dan pengawasan.'],
                    ['user' => 'sekretaris@sianggar.test', 'message' => 'Mohon lampirkan RAB detail dan timeline pelaksanaan.'],
                    ['user' => 'smp55@sianggar.test', 'message' => 'Sudah kami lampirkan di dokumen terbaru.'],
                ],
            ],
            [
                'pengajuan_nama' => 'Bantuan Bencana Alam',
                'status' => 'open',
                'messages' => [
                    ['user' => 'ketum@sianggar.test', 'message' => 'Distribusi bantuan ke wilayah mana saja?'],
                    ['user' => 'laz@sianggar.test', 'message' => 'Fokus ke 3 kabupaten terdampak: Cianjur, Garut, dan Tasikmalaya.'],
                ],
            ],
        ];

        foreach ($discussions as $disc) {
            $pengajuan = PengajuanAnggaran::where('nama_pengajuan', $disc['pengajuan_nama'])->first();
            if (! $pengajuan) {
                continue;
            }

            $isOpen = $disc['status'] === 'open';
            $discussion = Discussion::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'status' => $disc['status'],
                'opened_by' => $ketum?->id,
                'closed_by' => $isOpen ? null : $ketum?->id,
                'opened_at' => Carbon::now()->subDays(rand(3, 10)),
                'closed_at' => $isOpen ? null : Carbon::now()->subDays(rand(1, 2)),
            ]);

            foreach ($disc['messages'] as $idx => $msg) {
                $msgUser = User::where('email', $msg['user'])->first();
                if (! $msgUser) {
                    continue;
                }

                DiscussionMessage::create([
                    'discussion_id' => $discussion->id,
                    'user_id' => $msgUser->id,
                    'message' => $msg['message'],
                    'created_at' => Carbon::now()->subDays(rand(1, 5))->addHours($idx),
                    'updated_at' => Carbon::now()->subDays(rand(1, 5))->addHours($idx),
                ]);
            }
        }
    }

    // =========================================================================
    // 4d. AmountEditLog — amount adjustments by keuangan/bendahara
    // =========================================================================

    private function seedAmountEditLogs(): void
    {
        $keuangan = User::where('email', 'keuangan@sianggar.test')->first();
        $bendahara = User::where('email', 'bendahara@sianggar.test')->first();

        $edits = [
            ['Pelatihan Montessori', $keuangan, 4_500_000, 4_200_000, 'Penyesuaian harga pelatih setelah negosiasi.'],
            ['Kegiatan Camping', $keuangan, 12_000_000, 11_500_000, 'Pengurangan volume transportasi.'],
            ['Wisuda Angkatan', $bendahara, 50_000_000, 48_000_000, 'Negosiasi harga venue dan katering.'],
            ['Bakti Sosial Ramadhan', $bendahara, 15_000_000, 14_500_000, 'Penyesuaian harga sembako.'],
        ];

        foreach ($edits as [$nama, $editor, $originalAmount, $newAmount, $reason]) {
            $pengajuan = PengajuanAnggaran::where('nama_pengajuan', $nama)->first();
            if (! $pengajuan || ! $editor) {
                continue;
            }

            AmountEditLog::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'edited_by' => $editor->id,
                'original_amount' => $originalAmount,
                'new_amount' => $newAmount,
                'reason' => $reason,
            ]);
        }
    }

    // =========================================================================
    // 4e. RevisionComment — polymorphic comments on revised documents
    // =========================================================================

    private function seedRevisionComments(): void
    {
        // --- Pengajuan: SD Seragam (existing RevisionRequired from PengajuanSeeder) ---
        $sdSeragam = PengajuanAnggaran::where('nama_pengajuan', 'Pengadaan Seragam Guru')->first();
        if ($sdSeragam) {
            $this->createComment($sdSeragam, 'staff.direktur@sianggar.test', 1, true,
                'Mohon lampirkan perbandingan harga minimal dari 2 supplier. Detail ukuran juga perlu dilengkapi.');
            $this->createComment($sdSeragam, 'sd@sianggar.test', 1, false,
                'Baik, akan kami lengkapi perbandingan harga dan detail ukuran seragam.');
        }

        // --- Pengajuan: SDM Soft Skills (new RevisionRequired) ---
        $sdmSoftSkill = PengajuanAnggaran::where('nama_pengajuan', 'Pelatihan Soft Skills')->first();
        if ($sdmSoftSkill) {
            $this->createComment($sdmSoftSkill, 'kabag@sianggar.test', 1, true,
                'Mohon perjelas sasaran peserta dan materi pelatihan. Sertakan juga CV trainer.');
            $this->createComment($sdmSoftSkill, 'sdm@sianggar.test', 1, false,
                'Terima kasih atas masukannya. Kami sedang menyiapkan dokumen lengkap.');
        }

        // --- Pengajuan: Sekretariat Filling Cabinet (new RevisionRequired) ---
        $sekFilling = PengajuanAnggaran::where('nama_pengajuan', 'Pengadaan Filling Cabinet')->first();
        if ($sekFilling) {
            $this->createComment($sekFilling, 'sekretariat@sianggar.test', 1, true,
                'Spesifikasi dan jumlah unit perlu disesuaikan. Sertakan layout penempatan.');
            $this->createComment($sekFilling, 'staff.sekretariat@sianggar.test', 1, false,
                'Akan kami revisi dan lampirkan denah penempatan filling cabinet.');
        }

        // --- PerubahanAnggaran: SMP55 (RevisionRequired from PerubahanAnggaranSeeder) ---
        $paSmp55 = PerubahanAnggaran::where('perihal', 'Geser anggaran kegiatan ke modal')->first();
        if ($paSmp55) {
            $this->createComment($paSmp55, 'direktur@sianggar.test', 1, true,
                'Mohon sertakan justifikasi detail kebutuhan proyektor dan spesifikasi teknis.');
            $this->createComment($paSmp55, 'smp55@sianggar.test', 1, false,
                'Baik Pak, akan kami lengkapi justifikasi dan spesifikasi proyektor yang dibutuhkan.');
        }

        // --- LPJ: SDM (Revised from LpjSeeder) ---
        $lpjSdm = Lpj::where('proses', 'revised')->first();
        if ($lpjSdm) {
            $this->createComment($lpjSdm, 'kabag@sianggar.test', 1, true,
                'Bukti pengeluaran untuk item pelatihan belum lengkap. Mohon dilengkapi.');
            $this->createComment($lpjSdm, 'sdm@sianggar.test', 1, false,
                'Kami sedang mengumpulkan bukti kuitansi yang kurang. Mohon waktu 2 hari.');
        }

        // --- RAPBS: Stebank (Rejected from RapbsSeeder) ---
        $rapbsStebank = Rapbs::whereHas('unit', fn ($q) => $q->where('kode', 'Stebank'))
            ->where('status', 'rejected')
            ->first();
        if ($rapbsStebank) {
            $this->createComment($rapbsStebank, 'direktur@sianggar.test', 1, true,
                'Alokasi anggaran belum proporsional. Belanja modal terlalu besar dibanding operasional.');
            $this->createComment($rapbsStebank, 'stebank@sianggar.test', 1, false,
                'Kami akan menyesuaikan proporsi anggaran sesuai arahan.');
        }
    }

    // =========================================================================
    // Helper: Create polymorphic RevisionComment
    // =========================================================================

    private function createComment(
        $document,
        string $userEmail,
        int $round,
        bool $isInitialNote,
        string $message,
    ): void {
        $user = User::where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        RevisionComment::create([
            'commentable_type' => get_class($document),
            'commentable_id' => $document->id,
            'user_id' => $user->id,
            'message' => $message,
            'revision_round' => $round,
            'is_initial_note' => $isInitialNote,
        ]);
    }

    // =========================================================================
    // Helper: Create PengajuanAnggaran
    // =========================================================================

    private function createPengajuan(
        string $userEmail,
        ?string $unitKode,
        string $nama,
        float $total,
        ProposalStatus $status,
        ?ApprovalStage $currentStage,
        string $submitterType,
        ?ReferenceType $referenceType,
        array $approvals,
        ?string $noVoucher = null,
    ): void {
        $user = User::where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        $unit = $unitKode ? Unit::where('kode', $unitKode)->first() : null;
        $unitNama = $unit?->nama ?? ucfirst(str_replace('@sianggar.test', '', $userEmail));
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
            'waktu_kegiatan' => Carbon::now()->addDays(rand(7, 30))->format('Y-m-d'),
            'unit' => $unitNama,
            'jumlah_pengajuan_total' => $total,
            'status_proses' => $status,
            'current_approval_stage' => $currentStage?->value,
            'submitter_type' => $submitterType,
            'amount_category' => AmountCategory::fromAmount($total),
            'reference_type' => $referenceType,
            'need_lpj' => $total >= 10_000_000,
            'approved_amount' => $status === ProposalStatus::Paid ? $total : null,
            'no_voucher' => $noVoucher,
            'status_payment' => $status === ProposalStatus::Paid ? 'paid' : 'unpaid',
        ]);

        // Create detail items
        $dma = DetailMataAnggaran::where('tahun', $this->tahun)->first();
        $ma = $dma?->mataAnggaran;
        $sub = $dma?->subMataAnggaran;

        DetailPengajuan::create([
            'pengajuan_anggaran_id' => $pengajuan->id,
            'detail_mata_anggaran_id' => $dma?->id,
            'mata_anggaran_id' => $ma?->id,
            'sub_mata_anggaran_id' => $sub?->id,
            'uraian' => $nama,
            'volume' => 1,
            'satuan' => 'paket',
            'harga_satuan' => $total,
            'jumlah' => $total,
        ]);

        // Create approval records
        $stageOrder = 1;
        foreach ($approvals as $approval) {
            $approver = isset($approval['approver'])
                ? User::where('email', $approval['approver'])->first()
                : null;

            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
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
