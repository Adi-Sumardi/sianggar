<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Report;

use App\Helpers\AcademicYear;
use App\Http\Controllers\Controller;
use App\Http\Resources\PengajuanResource;
use App\Models\Apbs;
use App\Models\Penerimaan;
use App\Models\PengajuanAnggaran;
use App\Models\RealisasiAnggaran;
use App\Models\Unit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LaporanController extends Controller
{
    /**
     * Generate pengajuan report data.
     * Automatically filters by user's role if they are Unit/Substansi role.
     */
    public function pengajuan(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = PengajuanAnggaran::with(['user', 'unitRelation', 'detailPengajuans']);

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            // Admin/Approver can filter by specific unit if provided
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('status')) {
            $query->where('status_proses', $request->query('status'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }

        $data = $query->orderByDesc('created_at')->get();

        return response()->json([
            'data' => PengajuanResource::collection($data),
            'summary' => [
                'total_count' => $data->count(),
                'total_amount' => $data->sum('jumlah_pengajuan_total'),
                'by_status' => $data->groupBy('status_proses')->map->count(),
            ],
        ]);
    }

    /**
     * Generate CAWU (quarterly) report per unit.
     * Automatically uses user's unit_id if they are Unit/Substansi role.
     */
    public function cawuUnit(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Auto-use user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $unitId = $user->unit_id;
        } else {
            $request->validate([
                'unit_id' => ['required', 'integer'],
            ]);
            $unitId = (int) $request->query('unit_id');
        }

        $request->validate([
            'tahun' => ['required', 'string'],
        ]);

        $tahun = $request->query('tahun');
        $unit = Unit::find($unitId);

        if (!$unit) {
            return response()->json([
                'message' => 'Unit tidak ditemukan.',
            ], 404);
        }

        $pengajuans = PengajuanAnggaran::where('unit_id', $unitId)
            ->where('tahun', $tahun)
            ->where('status_proses', 'approved')
            ->get();

        $realisasi = RealisasiAnggaran::where('unit_id', $unitId)
            ->where('tahun', $tahun)
            ->get();

        $penerimaan = Penerimaan::where('unit_id', $unitId)
            ->where('tahun', $tahun)
            ->get();

        return response()->json([
            'data' => [
                'unit_id' => $unitId,
                'unit_kode' => $unit->kode,
                'unit_nama' => $unit->nama,
                'tahun' => $tahun,
                'total_pengajuan' => $pengajuans->sum('jumlah_pengajuan_total'),
                'total_realisasi' => $realisasi->sum('jumlah_realisasi'),
                'total_penerimaan' => $penerimaan->sum('jumlah'),
                'pengajuans_count' => $pengajuans->count(),
                'monthly_realisasi' => $realisasi->groupBy('bulan')->map(function ($items) {
                    return [
                        'anggaran' => $items->sum('jumlah_anggaran'),
                        'realisasi' => $items->sum('jumlah_realisasi'),
                        'sisa' => $items->sum('sisa'),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Generate combined CAWU (quarterly) report across all units.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function cawuGabungan(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tahun = $request->query('tahun', AcademicYear::current());

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $units = Unit::where('id', $user->unit_id)->get();
        } elseif ($request->filled('unit_id')) {
            $units = Unit::where('id', $request->query('unit_id'))->get();
        } else {
            $units = Unit::all();
        }

        $data = $units->map(function (Unit $unit) use ($tahun) {
            $apbs = Apbs::where('unit_id', $unit->id)
                ->where('tahun', $tahun)
                ->first();

            $totalPengajuan = PengajuanAnggaran::where('unit_id', $unit->id)
                ->where('tahun', $tahun)
                ->where('status_proses', 'approved')
                ->sum('jumlah_pengajuan_total');

            $totalRealisasi = RealisasiAnggaran::where('unit_id', $unit->id)
                ->where('tahun', $tahun)
                ->sum('jumlah_realisasi');

            return [
                'unit_id' => $unit->id,
                'unit_kode' => $unit->kode,
                'unit_nama' => $unit->nama,
                'total_anggaran' => $apbs?->total_anggaran ?? 0,
                'total_pengajuan' => $totalPengajuan,
                'total_realisasi' => $totalRealisasi,
                'sisa_anggaran' => $apbs?->sisa_anggaran ?? 0,
            ];
        });

        return response()->json([
            'data' => [
                'tahun' => $tahun,
                'units' => $data,
                'grand_total' => [
                    'anggaran' => $data->sum('total_anggaran'),
                    'pengajuan' => $data->sum('total_pengajuan'),
                    'realisasi' => $data->sum('total_realisasi'),
                    'sisa' => $data->sum('sisa_anggaran'),
                ],
            ],
        ]);
    }

    /**
     * Generate accounting report data.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function accounting(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tahun = $request->query('tahun', AcademicYear::current());

        $penerimaanQuery = Penerimaan::with('unit')->where('tahun', $tahun);
        $realisasiQuery = RealisasiAnggaran::with('unit')->where('tahun', $tahun);

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $penerimaanQuery->where('unit_id', $user->unit_id);
            $realisasiQuery->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $penerimaanQuery->where('unit_id', $request->query('unit_id'));
            $realisasiQuery->where('unit_id', $request->query('unit_id'));
        }

        $penerimaan = $penerimaanQuery->get();
        $realisasi = $realisasiQuery->get();

        return response()->json([
            'data' => [
                'tahun' => $tahun,
                'total_penerimaan' => $penerimaan->sum('jumlah'),
                'total_realisasi' => $realisasi->sum('jumlah_realisasi'),
                'penerimaan_by_unit' => $penerimaan->groupBy('unit_id')->map(function ($items) {
                    $unit = $items->first()->unit;

                    return [
                        'unit' => $unit?->nama,
                        'total' => $items->sum('jumlah'),
                    ];
                })->values(),
                'realisasi_by_unit' => $realisasi->groupBy('unit_id')->map(function ($items) {
                    $unit = $items->first()->unit;

                    return [
                        'unit' => $unit?->nama,
                        'total_anggaran' => $items->sum('jumlah_anggaran'),
                        'total_realisasi' => $items->sum('jumlah_realisasi'),
                        'total_sisa' => $items->sum('sisa'),
                    ];
                })->values(),
            ],
        ]);
    }

    /**
     * Export report to Excel.
     */
    public function exportExcel(Request $request): Response|JsonResponse
    {
        $type = $request->query('type', 'pengajuan');
        $tahun = $request->query('tahun', AcademicYear::current());

        try {
            $sanitizedTahun = str_replace('/', '-', $tahun);
            $fileName = "laporan-{$type}-{$sanitizedTahun}.xlsx";

            // Build export data based on type
            $data = $this->getExportData($type, $tahun, $request);

            return response()->json([
                'message' => 'Export data siap.',
                'data' => $data,
                'meta' => [
                    'type' => $type,
                    'tahun' => $tahun,
                    'file_name' => $fileName,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export report to PDF.
     */
    public function exportPdf(Request $request): Response|JsonResponse
    {
        $type = $request->query('type', 'pengajuan');
        $tahun = $request->query('tahun', AcademicYear::current());

        try {
            $data = $this->getExportData($type, $tahun, $request);

            $pdf = Pdf::loadView("reports.{$type}", [
                'data' => $data,
                'tahun' => $tahun,
            ]);

            $fileName = "laporan-{$type}-{$tahun}.pdf";

            return $pdf->download($fileName);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get export data based on report type.
     * Automatically filters by user's role if they are Unit/Substansi role.
     */
    private function getExportData(string $type, string $tahun, Request $request): array
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return match ($type) {
            'pengajuan' => [
                'items' => PengajuanAnggaran::with(['user', 'detailPengajuans'])
                    ->where('tahun', $tahun)
                    ->when($user->role->shouldFilterByOwnData() && $user->unit_id !== null, fn ($q) => $q->where('unit_id', $user->unit_id))
                    ->when(!$user->role->shouldFilterByOwnData() && $request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->query('unit_id')))
                    ->orderByDesc('created_at')
                    ->get()
                    ->toArray(),
            ],
            'realisasi' => [
                'items' => RealisasiAnggaran::with('unit')
                    ->where('tahun', $tahun)
                    ->when($user->role->shouldFilterByOwnData() && $user->unit_id !== null, fn ($q) => $q->where('unit_id', $user->unit_id))
                    ->when(!$user->role->shouldFilterByOwnData() && $request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->query('unit_id')))
                    ->get()
                    ->toArray(),
            ],
            'penerimaan' => [
                'items' => Penerimaan::with('unit')
                    ->where('tahun', $tahun)
                    ->when($user->role->shouldFilterByOwnData() && $user->unit_id !== null, fn ($q) => $q->where('unit_id', $user->unit_id))
                    ->when(!$user->role->shouldFilterByOwnData() && $request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->query('unit_id')))
                    ->get()
                    ->toArray(),
            ],
            default => ['items' => []],
        };
    }
}
