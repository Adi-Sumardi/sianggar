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
     * Recalculate balance for a detail mata anggaran after changes
     * (e.g., after a proposal is approved or an LPJ is submitted)
     */
    public function recalculateBalance(DetailMataAnggaran $detail): void
    {
        // Sum all approved pengajuan amounts linked to this detail mata anggaran
        $totalUsed = DetailPengajuan::where('detail_mata_anggaran_id', $detail->id)
            ->whereHas('pengajuanAnggaran', function ($q) {
                $q->where('status_proses', 'approved')
                    ->orWhere('status_proses', 'paid');
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

        $totalAnggaran = $details->sum('anggaran');
        $totalDipakai = $details->sum('terpakai');
        $totalBalance = $details->sum('saldo');
        $totalRealisasi = $details->sum('realisasi');

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

            $totalAnggaran = (float) $details->sum('anggaran');
            $totalDipakai = (float) $details->sum('terpakai');
            $totalBalance = (float) $details->sum('saldo');
            $totalRealisasi = (float) $details->sum('realisasi');

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
            ->sum('anggaran');
    }
}
