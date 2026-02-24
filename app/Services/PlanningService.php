<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DetailMataAnggaran;
use App\Models\Pkt;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PlanningService
{
    /**
     * Get all PKT (Program Kerja Tahunan) entries for a specific unit and year
     */
    public function getPktByUnit(string $unit, string $tahun): Collection
    {
        return Pkt::with([
                'strategy',
                'indikator',
                'proker',
                'kegiatan',
                'mataAnggaran',
                'subMataAnggaran',
            ])
            ->where('unit', $unit)
            ->where('tahun', $tahun)
            ->orderBy('strategy_id')
            ->orderBy('indikator_id')
            ->orderBy('proker_id')
            ->orderBy('kegiatan_id')
            ->get();
    }

    /**
     * Link a PKT entry to a detail mata anggaran (budget line item)
     * This establishes the relationship between planning and budgeting
     */
    public function linkPktToAnggaran(Pkt $pkt, DetailMataAnggaran $detail): void
    {
        DB::transaction(function () use ($pkt, $detail) {
            // Validate that unit and tahun match
            if ($pkt->unit !== $detail->unit?->kode && $pkt->unit !== (string) $detail->unit_id) {
                // Try matching by unit_id through the unit relationship
                $detailUnit = $detail->unit;
                if ($detailUnit === null || $pkt->unit !== $detailUnit->kode) {
                    throw new \RuntimeException(
                        'PKT dan Detail Mata Anggaran harus berasal dari unit yang sama.'
                    );
                }
            }

            if ($pkt->tahun !== $detail->tahun) {
                throw new \RuntimeException(
                    'PKT dan Detail Mata Anggaran harus berasal dari tahun anggaran yang sama.'
                );
            }

            // Update PKT with the linked mata anggaran info
            $pkt->update([
                'mata_anggaran_id' => $detail->mata_anggaran_id,
                'sub_mata_anggaran_id' => $detail->sub_mata_anggaran_id,
                'saldo_anggaran' => $detail->saldo ?? $detail->anggaran,
            ]);

            // If the detail_mata_anggaran has a link-back field, update it as well
            if ($detail->pkt_id === null || $detail->pkt_id === 0) {
                $detail->update([
                    'pkt_id' => $pkt->id,
                ]);
            }
        });
    }

    /**
     * Get PKT entries grouped by strategy for a hierarchical tree view
     *
     * @return Collection<int, array{
     *     strategy: \App\Models\Strategy,
     *     indikators: Collection<int, array{
     *         indikator: \App\Models\Indikator,
     *         prokers: Collection<int, array{
     *             proker: \App\Models\Proker,
     *             kegiatans: Collection<int, array{
     *                 kegiatan: \App\Models\Kegiatan,
     *                 pkts: Collection,
     *             }>
     *         }>
     *     }>
     * }>
     */
    public function getPktTreeByUnit(string $unit, string $tahun): Collection
    {
        $pkts = $this->getPktByUnit($unit, $tahun);

        return $pkts->groupBy('strategy_id')->map(function (Collection $strategyGroup) {
            $firstPkt = $strategyGroup->first();

            return [
                'strategy' => $firstPkt->strategy,
                'indikators' => $strategyGroup->groupBy('indikator_id')->map(function (Collection $indikatorGroup) {
                    $firstPkt = $indikatorGroup->first();

                    return [
                        'indikator' => $firstPkt->indikator,
                        'prokers' => $indikatorGroup->groupBy('proker_id')->map(function (Collection $prokerGroup) {
                            $firstPkt = $prokerGroup->first();

                            return [
                                'proker' => $firstPkt->proker,
                                'kegiatans' => $prokerGroup->groupBy('kegiatan_id')->map(function (Collection $kegiatanGroup) {
                                    $firstPkt = $kegiatanGroup->first();

                                    return [
                                        'kegiatan' => $firstPkt->kegiatan,
                                        'pkts' => $kegiatanGroup,
                                    ];
                                })->values(),
                            ];
                        })->values(),
                    ];
                })->values(),
            ];
        })->values();
    }

    /**
     * Get summary of budget allocation per strategy for a unit
     *
     * @return array<int, array{
     *     strategy_id: int,
     *     strategy_nama: string,
     *     total_anggaran: float,
     *     jumlah_kegiatan: int,
     * }>
     */
    public function getBudgetAllocationSummary(string $unit, string $tahun): array
    {
        $pkts = $this->getPktByUnit($unit, $tahun);

        return $pkts->groupBy('strategy_id')->map(function (Collection $group) {
            $first = $group->first();

            return [
                'strategy_id' => $first->strategy_id,
                'strategy_nama' => $first->strategy?->nama ?? '-',
                'total_anggaran' => (float) $group->sum('saldo_anggaran'),
                'jumlah_kegiatan' => $group->count(),
            ];
        })->values()->toArray();
    }
}
