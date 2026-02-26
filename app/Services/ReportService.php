<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProposalStatus;
use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get filtered list of pengajuan for reporting
     *
     * @param array{
     *     unit?: string,
     *     tahun?: string,
     *     status?: string,
     *     tanggal_dari?: string,
     *     tanggal_sampai?: string,
     *     search?: string,
     * } $filters
     */
    public function getLaporanPengajuan(array $filters): Collection
    {
        $query = PengajuanAnggaran::with(['details', 'approvals', 'creator']);

        if (!empty($filters['unit'])) {
            $query->where('unit', $filters['unit']);
        }

        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }

        if (!empty($filters['status'])) {
            $query->where('status_proses', $filters['status']);
        }

        if (!empty($filters['tanggal_dari'])) {
            $query->whereDate('tanggal', '>=', $filters['tanggal_dari']);
        }

        if (!empty($filters['tanggal_sampai'])) {
            $query->whereDate('tanggal', '<=', $filters['tanggal_sampai']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('no_surat', 'like', "%{$search}%")
                    ->orWhere('perihal', 'like', "%{$search}%")
                    ->orWhere('keperluan', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('tanggal')->get();
    }

    /**
     * Get cawu (catur wulan / four-month period) report for a specific unit
     *
     * Cawu 1: January - April
     * Cawu 2: May - August
     * Cawu 3: September - December
     *
     * @return array{
     *     unit: string,
     *     tahun: string,
     *     cawu: int,
     *     periode: string,
     *     items: array<int, array{
     *         mata_anggaran: string,
     *         anggaran: float,
     *         pengajuan: float,
     *         realisasi: float,
     *         sisa: float,
     *         persentase: float,
     *     }>,
     *     summary: array{
     *         total_anggaran: float,
     *         total_pengajuan: float,
     *         total_realisasi: float,
     *         total_sisa: float,
     *         persentase_realisasi: float,
     *     }
     * }
     */
    public function getLaporanCawu(string $unit, string $tahun, int $cawu): array
    {
        [$startMonth, $endMonth] = $this->getCawuMonths($cawu);
        $startDate = "{$tahun}-" . str_pad((string) $startMonth, 2, '0', STR_PAD_LEFT) . "-01";
        $endDate = "{$tahun}-" . str_pad((string) $endMonth, 2, '0', STR_PAD_LEFT) . "-" . cal_days_in_month(CAL_GREGORIAN, $endMonth, (int) $tahun);

        $periodeLabel = $this->getCawuLabel($cawu);

        // Get all detail mata anggaran for this unit and year
        $details = DetailMataAnggaran::where('unit_id', function ($q) use ($unit) {
                $q->select('id')->from('units')->where('kode', $unit)->limit(1);
            })
            ->where('tahun', $tahun)
            ->with(['mataAnggaran', 'subMataAnggaran'])
            ->get();

        $detailIds = $details->pluck('id');

        // Batch: single query for all pengajuan sums grouped by detail_mata_anggaran_id
        $pengajuanSums = DetailPengajuan::whereIn('detail_mata_anggaran_id', $detailIds)
            ->whereHas('pengajuanAnggaran', function ($q) use ($startDate, $endDate) {
                $q->whereDate('tanggal', '>=', $startDate)
                    ->whereDate('tanggal', '<=', $endDate)
                    ->whereIn('status_proses', [
                        ProposalStatus::Approved->value,
                        ProposalStatus::Paid->value,
                    ]);
            })
            ->selectRaw('detail_mata_anggaran_id, SUM(jumlah) as total')
            ->groupBy('detail_mata_anggaran_id')
            ->pluck('total', 'detail_mata_anggaran_id');

        // Batch: single query for all realisasi sums grouped by detail_mata_anggaran_id
        $realisasiSums = DB::table('realisasi_anggarans')
            ->whereIn('detail_mata_anggaran_id', $detailIds)
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->selectRaw('detail_mata_anggaran_id, SUM(jumlah) as total')
            ->groupBy('detail_mata_anggaran_id')
            ->pluck('total', 'detail_mata_anggaran_id');

        $items = [];
        $totalAnggaran = 0.0;
        $totalPengajuan = 0.0;
        $totalRealisasi = 0.0;
        $totalSisa = 0.0;

        foreach ($details as $detail) {
            $anggaran = (float) $detail->anggaran;
            $pengajuan = (float) ($pengajuanSums[$detail->id] ?? 0);
            $realisasi = (float) ($realisasiSums[$detail->id] ?? 0);

            $sisa = $anggaran - $realisasi;
            $persentase = $anggaran > 0 ? round(($realisasi / $anggaran) * 100, 2) : 0.0;

            $mataAnggaranName = $detail->mataAnggaran?->nama ?? '-';
            if ($detail->subMataAnggaran) {
                $mataAnggaranName .= ' - ' . $detail->subMataAnggaran->nama;
            }

            $items[] = [
                'detail_mata_anggaran_id' => $detail->id,
                'mata_anggaran' => $mataAnggaranName,
                'kode' => $detail->mataAnggaran?->kode ?? '-',
                'anggaran' => $anggaran,
                'pengajuan' => $pengajuan,
                'realisasi' => $realisasi,
                'sisa' => $sisa,
                'persentase' => $persentase,
            ];

            $totalAnggaran += $anggaran;
            $totalPengajuan += $pengajuan;
            $totalRealisasi += $realisasi;
            $totalSisa += $sisa;
        }

        $persentaseTotal = $totalAnggaran > 0
            ? round(($totalRealisasi / $totalAnggaran) * 100, 2)
            : 0.0;

        return [
            'unit' => $unit,
            'tahun' => $tahun,
            'cawu' => $cawu,
            'periode' => $periodeLabel,
            'items' => $items,
            'summary' => [
                'total_anggaran' => $totalAnggaran,
                'total_pengajuan' => $totalPengajuan,
                'total_realisasi' => $totalRealisasi,
                'total_sisa' => $totalSisa,
                'persentase_realisasi' => $persentaseTotal,
            ],
        ];
    }

    /**
     * Get combined cawu report across all units
     *
     * @return array{
     *     tahun: string,
     *     cawu: int,
     *     periode: string,
     *     units: array<int, array{
     *         unit_kode: string,
     *         unit_nama: string,
     *         total_anggaran: float,
     *         total_pengajuan: float,
     *         total_realisasi: float,
     *         total_sisa: float,
     *         persentase_realisasi: float,
     *     }>,
     *     grand_total: array{
     *         total_anggaran: float,
     *         total_pengajuan: float,
     *         total_realisasi: float,
     *         total_sisa: float,
     *         persentase_realisasi: float,
     *     }
     * }
     */
    public function getLaporanCawuGabungan(string $tahun, int $cawu): array
    {
        $units = Unit::orderBy('kode')->get();
        $periodeLabel = $this->getCawuLabel($cawu);

        $unitReports = [];
        $grandTotalAnggaran = 0.0;
        $grandTotalPengajuan = 0.0;
        $grandTotalRealisasi = 0.0;
        $grandTotalSisa = 0.0;

        foreach ($units as $unit) {
            $report = $this->getLaporanCawu($unit->kode, $tahun, $cawu);

            $unitReports[] = [
                'unit_kode' => $unit->kode,
                'unit_nama' => $unit->nama,
                'total_anggaran' => $report['summary']['total_anggaran'],
                'total_pengajuan' => $report['summary']['total_pengajuan'],
                'total_realisasi' => $report['summary']['total_realisasi'],
                'total_sisa' => $report['summary']['total_sisa'],
                'persentase_realisasi' => $report['summary']['persentase_realisasi'],
            ];

            $grandTotalAnggaran += $report['summary']['total_anggaran'];
            $grandTotalPengajuan += $report['summary']['total_pengajuan'];
            $grandTotalRealisasi += $report['summary']['total_realisasi'];
            $grandTotalSisa += $report['summary']['total_sisa'];
        }

        $grandPersentase = $grandTotalAnggaran > 0
            ? round(($grandTotalRealisasi / $grandTotalAnggaran) * 100, 2)
            : 0.0;

        return [
            'tahun' => $tahun,
            'cawu' => $cawu,
            'periode' => $periodeLabel,
            'units' => $unitReports,
            'grand_total' => [
                'total_anggaran' => $grandTotalAnggaran,
                'total_pengajuan' => $grandTotalPengajuan,
                'total_realisasi' => $grandTotalRealisasi,
                'total_sisa' => $grandTotalSisa,
                'persentase_realisasi' => $grandPersentase,
            ],
        ];
    }

    /**
     * Get start and end months for a cawu period
     *
     * @return array{0: int, 1: int}
     */
    private function getCawuMonths(int $cawu): array
    {
        return match ($cawu) {
            1 => [1, 4],
            2 => [5, 8],
            3 => [9, 12],
            default => throw new \InvalidArgumentException("Cawu harus bernilai 1, 2, atau 3. Diberikan: {$cawu}"),
        };
    }

    /**
     * Get human-readable label for a cawu period
     */
    private function getCawuLabel(int $cawu): string
    {
        return match ($cawu) {
            1 => 'Januari - April',
            2 => 'Mei - Agustus',
            3 => 'September - Desember',
            default => throw new \InvalidArgumentException("Cawu harus bernilai 1, 2, atau 3. Diberikan: {$cawu}"),
        };
    }
}
