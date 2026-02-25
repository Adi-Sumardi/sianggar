<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\PerubahanAnggaranStatus;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\PerubahanAnggaranItem;
use App\Models\PerubahanAnggaranLog;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PerubahanAnggaranSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    private string $tahunDoc = '2026';

    private int $nomorUrut = 1;

    public function run(): void
    {
        // =====================================================================
        // UNIT PATH: Direktur → WakilKetua → Ketum → Keuangan → Bendahara
        // =====================================================================

        // 1. Draft
        $this->createPerubahan(
            userEmail: 'sd@sianggar.test',
            unitKode: 'SD',
            perihal: 'Geser anggaran ATK ke perlengkapan',
            alasan: 'Kebutuhan perlengkapan mengajar lebih mendesak.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::Draft,
            currentStage: null,
            items: [
                ['type' => 'geser', 'amount' => 1_500_000, 'keterangan' => 'Transfer dari ATK ke perlengkapan'],
            ],
            approvals: [],
        );

        // 2. Submitted (waiting for Direktur)
        $this->createPerubahan(
            userEmail: 'smp12@sianggar.test',
            unitKode: 'SMP12',
            perihal: 'Geser anggaran honorarium ke pemeliharaan',
            alasan: 'Perbaikan mendesak fasilitas sekolah.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::Submitted,
            currentStage: ApprovalStage::Direktur,
            items: [
                ['type' => 'geser', 'amount' => 2_000_000, 'keterangan' => 'Honor ke pemeliharaan gedung'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 3. ApprovedLevel1 (Direktur approved, waiting for WakilKetua)
        $this->createPerubahan(
            userEmail: 'tk@sianggar.test',
            unitKode: 'TK',
            perihal: 'Tambahan anggaran kegiatan pembelajaran',
            alasan: 'Penambahan program ekstrakurikuler baru.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::ApprovedLevel1,
            currentStage: ApprovalStage::WakilKetua,
            items: [
                ['type' => 'tambah', 'amount' => 3_000_000, 'keterangan' => 'Tambah anggaran ekstrakurikuler'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 4. ApprovedLevel2 (WakilKetua approved, waiting for Ketum)
        $this->createPerubahan(
            userEmail: 'sma33@sianggar.test',
            unitKode: 'SMA33',
            perihal: 'Geser anggaran operasional ke modal',
            alasan: 'Pengadaan komputer laboratorium mendesak.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            items: [
                ['type' => 'geser', 'amount' => 4_000_000, 'keterangan' => 'Operasional ke belanja modal komputer'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 5. ApprovedLevel3 (Ketum approved, waiting for Keuangan)
        $this->createPerubahan(
            userEmail: 'pg@sianggar.test',
            unitKode: 'PG',
            perihal: 'Tambahan anggaran konsumsi kegiatan',
            alasan: 'Peningkatan jumlah peserta acara.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::ApprovedLevel3,
            currentStage: ApprovalStage::Keuangan,
            items: [
                ['type' => 'tambah', 'amount' => 1_000_000, 'keterangan' => 'Tambah konsumsi peserta'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 6. Processed (all approved, executed by Bendahara)
        $this->createPerubahan(
            userEmail: 'ra@sianggar.test',
            unitKode: 'RA',
            perihal: 'Geser anggaran gaji ke barang habis pakai',
            alasan: 'Kebutuhan mendesak bahan praktik.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::Processed,
            currentStage: null,
            items: [
                ['type' => 'geser', 'amount' => 2_500_000, 'keterangan' => 'Gaji ke bahan habis pakai'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
            ],
            processed: true,
        );

        // =====================================================================
        // SUBSTANSI PATH: KabagSekretariat → Sekretaris → Ketum → Keuangan → Bendahara
        // =====================================================================

        // 7. Submitted (waiting for KabagSekretariat)
        $this->createPerubahan(
            userEmail: 'asrama@sianggar.test',
            unitKode: null,
            perihal: 'Geser anggaran perbaikan ke pengadaan',
            alasan: 'Pengadaan kasur baru lebih prioritas.',
            submitterType: 'substansi',
            status: PerubahanAnggaranStatus::Submitted,
            currentStage: ApprovalStage::KabagSekretariat,
            items: [
                ['type' => 'geser', 'amount' => 3_500_000, 'keterangan' => 'Perbaikan ke pengadaan kasur'],
            ],
            approvals: [
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 8. ApprovedLevel1 (KabagSekretariat approved, waiting for Sekretaris)
        $this->createPerubahan(
            userEmail: 'litbang@sianggar.test',
            unitKode: null,
            perihal: 'Tambahan anggaran penelitian',
            alasan: 'Penambahan scope penelitian baru.',
            submitterType: 'substansi',
            status: PerubahanAnggaranStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Sekretaris,
            items: [
                ['type' => 'tambah', 'amount' => 2_000_000, 'keterangan' => 'Tambah anggaran riset'],
            ],
            approvals: [
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 9. ApprovedLevel4 (all approved through Keuangan, waiting for Bendahara execution)
        $this->createPerubahan(
            userEmail: 'sdm@sianggar.test',
            unitKode: null,
            perihal: 'Geser anggaran pelatihan ke rekrutmen',
            alasan: 'Kebutuhan rekrutmen staff baru mendesak.',
            submitterType: 'substansi',
            status: PerubahanAnggaranStatus::ApprovedLevel4,
            currentStage: ApprovalStage::Bendahara,
            items: [
                ['type' => 'geser', 'amount' => 5_000_000, 'keterangan' => 'Pelatihan ke rekrutmen'],
            ],
            approvals: [
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        // 10. Processed (substansi, fully executed)
        $this->createPerubahan(
            userEmail: 'umum@sianggar.test',
            unitKode: null,
            perihal: 'Tambahan anggaran pemeliharaan gedung',
            alasan: 'Kerusakan mendadak pada atap gedung utama.',
            submitterType: 'substansi',
            status: PerubahanAnggaranStatus::Processed,
            currentStage: null,
            items: [
                ['type' => 'tambah', 'amount' => 4_000_000, 'keterangan' => 'Perbaikan atap mendesak'],
            ],
            approvals: [
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
            ],
            processed: true,
        );

        // 11. RevisionRequired
        $this->createPerubahan(
            userEmail: 'smp55@sianggar.test',
            unitKode: 'SMP55',
            perihal: 'Geser anggaran kegiatan ke modal',
            alasan: 'Pembelian proyektor tambahan.',
            submitterType: 'unit',
            status: PerubahanAnggaranStatus::RevisionRequired,
            currentStage: ApprovalStage::Direktur,
            items: [
                ['type' => 'geser', 'amount' => 3_000_000, 'keterangan' => 'Kegiatan ke modal'],
            ],
            approvals: [
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Revised, 'approver' => 'direktur@sianggar.test', 'notes' => 'Mohon sertakan justifikasi detail kebutuhan proyektor.'],
            ],
        );

        // 12. Rejected
        $this->createPerubahan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unitKode: null,
            perihal: 'Tambahan anggaran rapat koordinasi',
            alasan: 'Kebutuhan rapat tambahan akhir tahun.',
            submitterType: 'substansi',
            status: PerubahanAnggaranStatus::Rejected,
            currentStage: null,
            items: [
                ['type' => 'tambah', 'amount' => 2_000_000, 'keterangan' => 'Rapat koordinasi tambahan'],
            ],
            approvals: [
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Rejected, 'approver' => 'sekretariat@sianggar.test', 'notes' => 'Anggaran rapat sudah cukup, penambahan tidak diperlukan.'],
            ],
        );
    }

    // =========================================================================
    // Helper: Create PerubahanAnggaran with items, approvals, and optional logs
    // =========================================================================

    private function createPerubahan(
        string $userEmail,
        ?string $unitKode,
        string $perihal,
        string $alasan,
        string $submitterType,
        PerubahanAnggaranStatus $status,
        ?ApprovalStage $currentStage,
        array $items,
        array $approvals,
        bool $processed = false,
    ): void {
        $user = User::where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        $unit = $unitKode ? Unit::where('kode', $unitKode)->first() : null;
        $nomor = sprintf('PRB/%s/%s/%03d', $this->tahunDoc, strtoupper(substr($unitKode ?? 'SUB', 0, 3)), $this->nomorUrut++);

        // Get DMAs for item creation
        $dmaQuery = DetailMataAnggaran::where('tahun', $this->tahun);
        if ($unit) {
            $dmaQuery->where('unit_id', $unit->id);
        }
        $dmas = $dmaQuery->limit(5)->get();

        $totalAmount = 0;
        foreach ($items as $item) {
            $totalAmount += $item['amount'];
        }

        $bendahara = User::where('email', 'bendahara@sianggar.test')->first();

        $perubahan = PerubahanAnggaran::create([
            'nomor_perubahan' => $nomor,
            'user_id' => $user->id,
            'unit_id' => $unit?->id,
            'tahun' => $this->tahun,
            'perihal' => $perihal,
            'alasan' => $alasan,
            'submitter_type' => $submitterType,
            'status' => $status,
            'current_approval_stage' => $currentStage?->value,
            'total_amount' => $totalAmount,
            'processed_at' => $processed ? Carbon::now()->subDays(rand(1, 3)) : null,
            'processed_by' => $processed ? $bendahara?->id : null,
        ]);

        // Create items
        $itemIndex = 0;
        foreach ($items as $item) {
            $sourceDma = $item['type'] === 'geser' && $dmas->count() > 0 ? $dmas->get($itemIndex % $dmas->count()) : null;
            $targetDma = $dmas->count() > 1 ? $dmas->get(($itemIndex + 1) % $dmas->count()) : $dmas->first();

            $paItem = PerubahanAnggaranItem::create([
                'perubahan_anggaran_id' => $perubahan->id,
                'type' => $item['type'],
                'source_detail_mata_anggaran_id' => $sourceDma?->id,
                'target_detail_mata_anggaran_id' => $targetDma?->id,
                'amount' => $item['amount'],
                'keterangan' => $item['keterangan'],
            ]);

            // Create log for processed items
            if ($processed && $targetDma) {
                $sourceBefore = $sourceDma ? (float) $sourceDma->balance : 0;
                $targetBefore = (float) $targetDma->balance;

                PerubahanAnggaranLog::create([
                    'perubahan_anggaran_id' => $perubahan->id,
                    'perubahan_anggaran_item_id' => $paItem->id,
                    'source_detail_mata_anggaran_id' => $sourceDma?->id,
                    'target_detail_mata_anggaran_id' => $targetDma->id,
                    'source_saldo_before' => $sourceBefore,
                    'source_saldo_after' => $sourceDma ? $sourceBefore - $item['amount'] : 0,
                    'target_saldo_before' => $targetBefore,
                    'target_saldo_after' => $targetBefore + $item['amount'],
                    'amount' => $item['amount'],
                    'executed_by' => $bendahara?->id,
                    'executed_at' => Carbon::now()->subDays(rand(1, 3)),
                ]);
            }

            $itemIndex++;
        }

        // Create approval records
        $stageOrder = 1;
        foreach ($approvals as $approval) {
            $approver = isset($approval['approver'])
                ? User::where('email', $approval['approver'])->first()
                : null;

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
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
