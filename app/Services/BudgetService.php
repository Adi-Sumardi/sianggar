<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\RealisasiAnggaran;
use App\Models\Unit;

class BudgetService
{
    /**
     * Recalculate balance for a detail mata anggaran after changes.
     * Counts ALL active (non-draft, non-rejected) pengajuan as reserved.
     */
    public function recalculateBalance(DetailMataAnggaran $detail): void
    {
        // Sum all active pengajuan amounts (bank-like: reserved on submit)
        $totalUsed = DetailPengajuan::where('detail_mata_anggaran_id', $detail->id)
            ->whereHas('pengajuanAnggaran', function ($q) {
                $q->whereNotIn('status_proses', ['draft', 'rejected']);
            })
            ->sum('jumlah');

        // Sum all realisasi amounts linked to this detail mata anggaran
        $totalRealisasi = RealisasiAnggaran::where('detail_mata_anggaran_id', $detail->id)
            ->sum('jumlah');

        $anggaranAwal = (float) $detail->anggaran_awal;
        $balance = $anggaranAwal - (float) $totalUsed;

        $detail->update([
            'saldo_dipakai' => $totalUsed,
            'balance' => $balance,
            'realisasi_year' => $totalRealisasi,
        ]);
    }

    /**
     * Get budget summary for a specific unit and fiscal year
     *
     * @return array{total_anggaran: float, total_dipakai: float, total_balance: float, total_realisasi: float}
     */
    public function getBudgetSummaryByUnit(int $unitId, string $tahun): array
    {
        $details = DetailMataAnggaran::where('unit_id', $unitId)
            ->where('tahun', $tahun)
            ->get();

        $totalAnggaran = $details->sum('anggaran_awal');
        $totalDipakai = $details->sum('saldo_dipakai');
        $totalBalance = $details->sum('balance');
        $totalRealisasi = $details->sum('realisasi_year');

        return [
            'total_anggaran' => (float) $totalAnggaran,
            'total_dipakai' => (float) $totalDipakai,
            'total_balance' => (float) $totalBalance,
            'total_realisasi' => (float) $totalRealisasi,
        ];
    }

    /**
     * Get budget vs realization comparison for all units in a fiscal year
     *
     * @return array<int, array{unit_id: int, unit_kode: string, unit_nama: string, total_anggaran: float, total_dipakai: float, total_balance: float, total_realisasi: float, persentase_realisasi: float}>
     */
    public function getBudgetVsRealization(string $tahun): array
    {
        $units = Unit::with(['detailMataAnggarans' => function ($q) use ($tahun) {
            $q->where('tahun', $tahun);
        }])->get();

        $result = [];

        foreach ($units as $unit) {
            $details = $unit->detailMataAnggarans;

            $totalAnggaran = (float) $details->sum('anggaran_awal');
            $totalDipakai = (float) $details->sum('saldo_dipakai');
            $totalBalance = (float) $details->sum('balance');
            $totalRealisasi = (float) $details->sum('realisasi_year');

            $persentaseRealisasi = $totalAnggaran > 0
                ? round(($totalRealisasi / $totalAnggaran) * 100, 2)
                : 0.0;

            $result[] = [
                'unit_id' => $unit->id,
                'unit_kode' => $unit->kode,
                'unit_nama' => $unit->nama,
                'total_anggaran' => $totalAnggaran,
                'total_dipakai' => $totalDipakai,
                'total_balance' => $totalBalance,
                'total_realisasi' => $totalRealisasi,
                'persentase_realisasi' => $persentaseRealisasi,
            ];
        }

        return $result;
    }

    /**
     * Get total budget across all units for a given fiscal year
     */
    public function getTotalBudget(string $tahun): float
    {
        return (float) DetailMataAnggaran::where('tahun', $tahun)
            ->sum('anggaran_awal');
    }
}
