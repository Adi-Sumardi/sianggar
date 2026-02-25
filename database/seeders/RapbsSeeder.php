<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Models\Apbs;
use App\Models\ApbsItem;
use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\Rapbs;
use App\Models\RapbsApproval;
use App\Models\RapbsItem;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RapbsSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    public function run(): void
    {
        // =====================================================================
        // 8 RAPBS — 1 per unit (unique constraint [unit_id, tahun])
        // Units: PG, RA, TK, SD, SMP12, SMP55, SMA33, Stebank
        // Unit flow: Direktur → Keuangan → Sekretaris → WakilKetua → Ketum → Bendahara
        // =====================================================================

        // 1. PG — Draft
        $this->createRapbs(
            unitKode: 'PG',
            submitterEmail: 'pg@sianggar.test',
            status: RapbsStatus::Draft,
            currentStage: null,
            approvals: [],
        );

        // 2. RA — Submitted (waiting for Direktur)
        $this->createRapbs(
            unitKode: 'RA',
            submitterEmail: 'ra@sianggar.test',
            status: RapbsStatus::Submitted,
            currentStage: RapbsApprovalStage::Direktur,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'pending', 'user' => 'ra@sianggar.test'],
            ],
        );

        // 3. TK — Verified (Direktur approved, waiting for Keuangan)
        $this->createRapbs(
            unitKode: 'TK',
            submitterEmail: 'tk@sianggar.test',
            status: RapbsStatus::Verified,
            currentStage: RapbsApprovalStage::Keuangan,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'approved', 'user' => 'direktur@sianggar.test'],
                ['stage' => RapbsApprovalStage::Keuangan, 'status' => 'pending', 'user' => 'direktur@sianggar.test'],
            ],
        );

        // 4. SD — InReview (Direktur + Keuangan approved, waiting for Sekretaris)
        $this->createRapbs(
            unitKode: 'SD',
            submitterEmail: 'sd@sianggar.test',
            status: RapbsStatus::InReview,
            currentStage: RapbsApprovalStage::Sekretaris,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'approved', 'user' => 'direktur@sianggar.test'],
                ['stage' => RapbsApprovalStage::Keuangan, 'status' => 'approved', 'user' => 'keuangan@sianggar.test'],
                ['stage' => RapbsApprovalStage::Sekretaris, 'status' => 'pending', 'user' => 'keuangan@sianggar.test'],
            ],
        );

        // 5. SMP12 — Approved (all stages approved up to Bendahara)
        $this->createRapbs(
            unitKode: 'SMP12',
            submitterEmail: 'smp12@sianggar.test',
            status: RapbsStatus::Approved,
            currentStage: null,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'approved', 'user' => 'direktur@sianggar.test'],
                ['stage' => RapbsApprovalStage::Keuangan, 'status' => 'approved', 'user' => 'keuangan@sianggar.test'],
                ['stage' => RapbsApprovalStage::Sekretaris, 'status' => 'approved', 'user' => 'sekretaris@sianggar.test'],
                ['stage' => RapbsApprovalStage::WakilKetua, 'status' => 'approved', 'user' => 'ketua1@sianggar.test'],
                ['stage' => RapbsApprovalStage::Ketum, 'status' => 'approved', 'user' => 'ketum@sianggar.test'],
                ['stage' => RapbsApprovalStage::Bendahara, 'status' => 'approved', 'user' => 'bendahara@sianggar.test'],
            ],
            approvedBy: 'bendahara@sianggar.test',
        );

        // 6. SMP55 — ApbsGenerated (fully approved + APBS generated)
        $this->createRapbs(
            unitKode: 'SMP55',
            submitterEmail: 'smp55@sianggar.test',
            status: RapbsStatus::ApbsGenerated,
            currentStage: null,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'approved', 'user' => 'direktur@sianggar.test'],
                ['stage' => RapbsApprovalStage::Keuangan, 'status' => 'approved', 'user' => 'keuangan@sianggar.test'],
                ['stage' => RapbsApprovalStage::Sekretaris, 'status' => 'approved', 'user' => 'sekretaris@sianggar.test'],
                ['stage' => RapbsApprovalStage::WakilKetua, 'status' => 'approved', 'user' => 'ketua1@sianggar.test'],
                ['stage' => RapbsApprovalStage::Ketum, 'status' => 'approved', 'user' => 'ketum@sianggar.test'],
                ['stage' => RapbsApprovalStage::Bendahara, 'status' => 'approved', 'user' => 'bendahara@sianggar.test'],
            ],
            approvedBy: 'bendahara@sianggar.test',
            createApbs: true,
        );

        // 7. SMA33 — Active (APBS generated + partial realisasi)
        $this->createRapbs(
            unitKode: 'SMA33',
            submitterEmail: 'sma33@sianggar.test',
            status: RapbsStatus::Active,
            currentStage: null,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'approved', 'user' => 'direktur@sianggar.test'],
                ['stage' => RapbsApprovalStage::Keuangan, 'status' => 'approved', 'user' => 'keuangan@sianggar.test'],
                ['stage' => RapbsApprovalStage::Sekretaris, 'status' => 'approved', 'user' => 'sekretaris@sianggar.test'],
                ['stage' => RapbsApprovalStage::WakilKetua, 'status' => 'approved', 'user' => 'ketua1@sianggar.test'],
                ['stage' => RapbsApprovalStage::Ketum, 'status' => 'approved', 'user' => 'ketum@sianggar.test'],
                ['stage' => RapbsApprovalStage::Bendahara, 'status' => 'approved', 'user' => 'bendahara@sianggar.test'],
            ],
            approvedBy: 'bendahara@sianggar.test',
            createApbs: true,
            partialRealisasi: true,
        );

        // 8. Stebank — Rejected (rejected at Direktur)
        $this->createRapbs(
            unitKode: 'Stebank',
            submitterEmail: 'stebank@sianggar.test',
            status: RapbsStatus::Rejected,
            currentStage: null,
            approvals: [
                ['stage' => RapbsApprovalStage::Direktur, 'status' => 'rejected', 'user' => 'direktur@sianggar.test', 'notes' => 'RAPBS perlu direvisi, alokasi anggaran belum proporsional.'],
            ],
        );
    }

    // =========================================================================
    // Helper: Create RAPBS with items, approvals, and optional APBS
    // =========================================================================

    private function createRapbs(
        string $unitKode,
        string $submitterEmail,
        RapbsStatus $status,
        ?RapbsApprovalStage $currentStage,
        array $approvals,
        ?string $approvedBy = null,
        bool $createApbs = false,
        bool $partialRealisasi = false,
    ): void {
        $unit = Unit::where('kode', $unitKode)->first();
        $submitter = User::where('email', $submitterEmail)->first();
        if (! $unit || ! $submitter) {
            return;
        }

        $isSubmitted = $status !== RapbsStatus::Draft;
        $isApproved = in_array($status, [
            RapbsStatus::Approved,
            RapbsStatus::ApbsGenerated,
            RapbsStatus::Active,
        ]);

        $approverUser = $approvedBy ? User::where('email', $approvedBy)->first() : null;

        $rapbs = Rapbs::create([
            'unit_id' => $unit->id,
            'tahun' => $this->tahun,
            'total_anggaran' => 0, // Recalculated after items
            'status' => $status,
            'current_approval_stage' => $currentStage?->value,
            'submitted_by' => $isSubmitted ? $submitter->id : null,
            'submitted_at' => $isSubmitted ? Carbon::now()->subDays(rand(10, 20)) : null,
            'approved_by' => $isApproved ? $approverUser?->id : null,
            'approved_at' => $isApproved ? Carbon::now()->subDays(rand(1, 5)) : null,
            'keterangan' => $status === RapbsStatus::Rejected
                ? 'Ditolak karena alokasi anggaran belum proporsional.'
                : null,
        ]);

        // Create items (3-5 per RAPBS) using unit's DMA data
        $this->createRapbsItems($rapbs, $unit);

        // Recalculate total from items
        $rapbs->recalculateTotal();

        // Create approval records
        $stageOrder = 1;
        foreach ($approvals as $approval) {
            $approvalUser = User::where('email', $approval['user'])->first();

            RapbsApproval::create([
                'rapbs_id' => $rapbs->id,
                'user_id' => $approvalUser?->id ?? $submitter->id,
                'stage' => $approval['stage']->value,
                'stage_order' => $stageOrder++,
                'status' => $approval['status'],
                'notes' => $approval['notes'] ?? null,
                'acted_at' => $approval['status'] !== 'pending'
                    ? Carbon::now()->subDays(rand(1, 15))
                    : null,
            ]);
        }

        // Create APBS if requested
        if ($createApbs) {
            $this->createApbsFromRapbs($rapbs, $unit, $partialRealisasi);
        }
    }

    // =========================================================================
    // Helper: Create RAPBS items using unit's DetailMataAnggaran
    // =========================================================================

    private function createRapbsItems(Rapbs $rapbs, Unit $unit): void
    {
        // Get unit's DMA with related mata anggaran
        $dmas = DetailMataAnggaran::where('unit_id', $unit->id)
            ->where('tahun', $this->tahun)
            ->with(['mataAnggaran', 'subMataAnggaran'])
            ->limit(5)
            ->get();

        if ($dmas->isEmpty()) {
            return;
        }

        $itemData = [
            ['nama' => 'Gaji Pokok Guru & Staff', 'volume' => 12, 'satuan' => 'bulan', 'harga' => 8_000_000],
            ['nama' => 'Alat Tulis Kantor', 'volume' => 4, 'satuan' => 'paket', 'harga' => 750_000],
            ['nama' => 'Bahan Habis Pakai', 'volume' => 6, 'satuan' => 'paket', 'harga' => 400_000],
            ['nama' => 'Pemeliharaan Gedung', 'volume' => 2, 'satuan' => 'kegiatan', 'harga' => 5_000_000],
            ['nama' => 'Kegiatan Ekstrakurikuler', 'volume' => 10, 'satuan' => 'kegiatan', 'harga' => 500_000],
        ];

        // Use withoutEvents to avoid premature recalculation on every insert
        RapbsItem::withoutEvents(function () use ($rapbs, $dmas, $itemData) {
            foreach ($itemData as $idx => $item) {
                $dma = $dmas->get($idx % $dmas->count());
                $ma = $dma->mataAnggaran;
                $sub = $dma->subMataAnggaran;
                $jumlah = $item['volume'] * $item['harga'];

                RapbsItem::create([
                    'rapbs_id' => $rapbs->id,
                    'pkt_id' => null,
                    'mata_anggaran_id' => $ma->id,
                    'sub_mata_anggaran_id' => $sub?->id,
                    'detail_mata_anggaran_id' => $dma->id,
                    'kode_coa' => $sub?->kode ?? $ma->kode,
                    'nama' => $item['nama'],
                    'uraian' => 'RAPBS item untuk ' . $item['nama'],
                    'volume' => $item['volume'],
                    'satuan' => $item['satuan'],
                    'harga_satuan' => $item['harga'],
                    'jumlah' => $jumlah,
                ]);
            }
        });
    }

    // =========================================================================
    // Helper: Create APBS + ApbsItem from approved RAPBS
    // =========================================================================

    private function createApbsFromRapbs(Rapbs $rapbs, Unit $unit, bool $partialRealisasi): void
    {
        $rapbs->load('items');
        $totalAnggaran = (float) $rapbs->total_anggaran;

        $apbs = Apbs::create([
            'unit_id' => $unit->id,
            'rapbs_id' => $rapbs->id,
            'tahun' => $this->tahun,
            'total_anggaran' => $totalAnggaran,
            'total_realisasi' => 0,
            'sisa_anggaran' => $totalAnggaran,
            'nomor_dokumen' => sprintf('APBS/%s/%s/001', $unit->kode, str_replace('/', '-', $this->tahun)),
            'tanggal_pengesahan' => Carbon::now()->subDays(rand(1, 5))->toDateString(),
            'status' => 'active',
            'keterangan' => null,
        ]);

        $totalRealisasi = 0;

        foreach ($rapbs->items as $rapbsItem) {
            $anggaran = (float) $rapbsItem->jumlah;
            $realisasi = 0;

            if ($partialRealisasi) {
                // 30-70% realisasi for each item
                $realisasi = round($anggaran * (rand(30, 70) / 100), 2);
                $totalRealisasi += $realisasi;
            }

            ApbsItem::create([
                'apbs_id' => $apbs->id,
                'rapbs_item_id' => $rapbsItem->id,
                'mata_anggaran_id' => $rapbsItem->mata_anggaran_id,
                'detail_mata_anggaran_id' => $rapbsItem->detail_mata_anggaran_id,
                'kode_coa' => $rapbsItem->kode_coa,
                'nama' => $rapbsItem->nama,
                'anggaran' => $anggaran,
                'realisasi' => $realisasi,
                'sisa' => $anggaran - $realisasi,
            ]);
        }

        // Update APBS totals
        if ($partialRealisasi) {
            $apbs->update([
                'total_realisasi' => $totalRealisasi,
                'sisa_anggaran' => $totalAnggaran - $totalRealisasi,
            ]);
        }
    }
}
