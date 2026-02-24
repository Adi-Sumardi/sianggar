<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\DetailMataAnggaran;
use App\Models\Pkt;
use App\Models\Rapbs;
use App\Models\RapbsItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PktService
{
    /**
     * Create PKT and auto-generate DetailMataAnggaran and RAPBS entry.
     */
    public function create(array $data, User $creator): Pkt
    {
        return DB::transaction(function () use ($data, $creator) {
            // Determine unit_id from creator if not provided
            $unitId = $data['unit_id'] ?? $creator->unit_id;

            // Create PKT first (without detail_mata_anggaran_id)
            $pkt = Pkt::create([
                ...$data,
                'unit_id' => $unitId,
                'created_by' => $creator->id,
                'status' => 'draft',
            ]);

            // Auto-create DetailMataAnggaran with the saldo_anggaran value
            $detailMataAnggaran = $this->createDetailMataAnggaran($pkt, $unitId);

            // Update PKT with the detail_mata_anggaran_id
            $pkt->update(['detail_mata_anggaran_id' => $detailMataAnggaran->id]);

            // Get or create RAPBS for this unit/year
            $rapbs = $this->getOrCreateRapbs($unitId, $pkt->tahun);

            // Create RAPBS item from PKT (now with detail_mata_anggaran_id)
            $this->createRapbsItem($rapbs, $pkt->fresh());

            // Log activity
            ActivityLog::log($pkt, 'created', null, $pkt->toArray(), $creator->id);

            return $pkt->fresh();
        });
    }

    /**
     * Update PKT and sync DetailMataAnggaran and RAPBS entry.
     */
    public function update(Pkt $pkt, array $data, User $updater): Pkt
    {
        return DB::transaction(function () use ($pkt, $data, $updater) {
            $oldData = $pkt->toArray();

            $pkt->update($data);

            // Update related DetailMataAnggaran if exists
            $detailMataAnggaran = $pkt->detailMataAnggaran;
            if ($detailMataAnggaran) {
                $saldoAnggaran = $pkt->saldo_anggaran ?? 0;
                $detailMataAnggaran->update([
                    'mata_anggaran_id' => $pkt->mata_anggaran_id,
                    'sub_mata_anggaran_id' => $pkt->sub_mata_anggaran_id,
                    'kode' => $pkt->getCoaCode(),
                    'nama' => $pkt->kegiatan?->nama ?? $pkt->deskripsi_kegiatan ?? 'Detail PKT',
                    'keterangan' => $pkt->deskripsi_kegiatan,
                    'harga_satuan' => $saldoAnggaran,
                    'jumlah' => $saldoAnggaran,
                    'anggaran_awal' => $saldoAnggaran,
                    'balance' => $saldoAnggaran - ($detailMataAnggaran->saldo_dipakai ?? 0),
                ]);
            }

            // Update related RAPBS item if exists
            $rapbsItem = $pkt->rapbsItems()->first();
            if ($rapbsItem) {
                $rapbsItem->update([
                    'mata_anggaran_id' => $pkt->mata_anggaran_id,
                    'sub_mata_anggaran_id' => $pkt->sub_mata_anggaran_id,
                    'detail_mata_anggaran_id' => $pkt->detail_mata_anggaran_id,
                    'kode_coa' => $pkt->getCoaCode(),
                    'nama' => $pkt->kegiatan?->nama ?? $pkt->deskripsi_kegiatan,
                    'uraian' => $pkt->deskripsi_kegiatan,
                    'harga_satuan' => $pkt->saldo_anggaran ?? 0,
                    'jumlah' => $pkt->saldo_anggaran,
                ]);
            }

            // Log activity
            ActivityLog::log($pkt, 'updated', $oldData, $pkt->fresh()->toArray(), $updater->id);

            return $pkt->fresh();
        });
    }

    /**
     * Delete PKT and related DetailMataAnggaran and RAPBS item.
     */
    public function delete(Pkt $pkt, User $deleter): bool
    {
        return DB::transaction(function () use ($pkt, $deleter) {
            // Log activity before deletion
            ActivityLog::log($pkt, 'deleted', $pkt->toArray(), null, $deleter->id);

            // Delete related RAPBS items
            $pkt->rapbsItems()->delete();

            // Delete related DetailMataAnggaran
            if ($pkt->detail_mata_anggaran_id) {
                DetailMataAnggaran::where('id', $pkt->detail_mata_anggaran_id)->delete();
            }

            // Delete PKT
            return $pkt->delete();
        });
    }

    /**
     * Get or create RAPBS for a unit/year combination.
     */
    protected function getOrCreateRapbs(?int $unitId, string $tahun): Rapbs
    {
        return Rapbs::firstOrCreate(
            [
                'unit_id' => $unitId,
                'tahun' => $tahun,
            ],
            [
                'total_anggaran' => 0,
                'status' => 'draft',
            ]
        );
    }

    /**
     * Create RAPBS item from PKT.
     */
    protected function createRapbsItem(Rapbs $rapbs, Pkt $pkt): RapbsItem
    {
        return RapbsItem::create([
            'rapbs_id' => $rapbs->id,
            'pkt_id' => $pkt->id,
            'mata_anggaran_id' => $pkt->mata_anggaran_id,
            'sub_mata_anggaran_id' => $pkt->sub_mata_anggaran_id,
            'detail_mata_anggaran_id' => $pkt->detail_mata_anggaran_id,
            'kode_coa' => $pkt->getCoaCode(),
            'nama' => $pkt->kegiatan?->nama ?? $pkt->deskripsi_kegiatan ?? 'Kegiatan PKT',
            'uraian' => $pkt->deskripsi_kegiatan,
            'volume' => 1,
            'satuan' => 'paket',
            'harga_satuan' => $pkt->saldo_anggaran ?? 0,
            'jumlah' => $pkt->saldo_anggaran ?? 0,
        ]);
    }

    /**
     * Create DetailMataAnggaran from PKT.
     */
    protected function createDetailMataAnggaran(Pkt $pkt, ?int $unitId): DetailMataAnggaran
    {
        $saldoAnggaran = $pkt->saldo_anggaran ?? 0;

        return DetailMataAnggaran::create([
            'mata_anggaran_id' => $pkt->mata_anggaran_id,
            'sub_mata_anggaran_id' => $pkt->sub_mata_anggaran_id,
            'unit_id' => $unitId,
            'pkt_id' => $pkt->id,
            'tahun' => $pkt->tahun,
            'kode' => $pkt->getCoaCode(),
            'nama' => $pkt->kegiatan?->nama ?? $pkt->deskripsi_kegiatan ?? 'Detail PKT',
            'volume' => 1,
            'satuan' => 'paket',
            'harga_satuan' => $saldoAnggaran,
            'jumlah' => $saldoAnggaran,
            'keterangan' => $pkt->deskripsi_kegiatan,
            'anggaran_awal' => $saldoAnggaran,
            'balance' => $saldoAnggaran,
            'saldo_dipakai' => 0,
            'realisasi_year' => 0,
        ]);
    }

    /**
     * Submit PKT (change status to submitted).
     */
    public function submit(Pkt $pkt, User $submitter): Pkt
    {
        return DB::transaction(function () use ($pkt, $submitter) {
            $pkt->update(['status' => 'submitted']);

            ActivityLog::log($pkt, 'submitted', ['status' => 'draft'], ['status' => 'submitted'], $submitter->id);

            return $pkt->fresh();
        });
    }

    /**
     * Get PKT list for a user.
     */
    public function getForUser(User $user, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = Pkt::with([
            'strategy',
            'indikator',
            'proker',
            'kegiatan',
            'mataAnggaran',
            'subMataAnggaran',
            'detailMataAnggaran',
            'unitRelation',
            'creator',
        ]);

        // Filter by unit if user is unit-based
        if ($user->role->isUnit() || $user->role->isSubstansi()) {
            $query->where('unit_id', $user->unit_id);
        }

        // Apply filters
        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }

        if (!empty($filters['unit_id'])) {
            $query->where('unit_id', $filters['unit_id']);
        }

        if (!empty($filters['strategy_id'])) {
            $query->where('strategy_id', $filters['strategy_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('deskripsi_kegiatan', 'like', "%{$search}%")
                    ->orWhere('tujuan_kegiatan', 'like', "%{$search}%")
                    ->orWhereHas('kegiatan', fn ($kq) => $kq->where('nama', 'like', "%{$search}%"));
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
