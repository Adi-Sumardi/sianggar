<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Helpers\AcademicYear;
use App\Http\Controllers\Controller;
use App\Models\Apbs;
use App\Models\MataAnggaran;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RapbsController extends Controller
{
    /**
     * Display aggregated RAPBS view.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tahun = $request->query('tahun', AcademicYear::current());

        $query = Unit::with([
            'apbs' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
            'mataAnggarans' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
            'mataAnggarans.subMataAnggarans.detailMataAnggarans' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
        ]);

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            // Admin/Approver can filter by specific unit if provided
            $query->where('id', $request->query('unit_id'));
        }

        $data = $query->get()
            ->map(function (Unit $unit) {
                $apbs = $unit->apbs->first();

                return [
                    'unit_id' => $unit->id,
                    'unit_kode' => $unit->kode,
                    'unit_nama' => $unit->nama,
                    'total_anggaran' => $apbs?->total_anggaran ?? 0,
                    'total_realisasi' => $apbs?->total_realisasi ?? 0,
                    'sisa_anggaran' => $apbs?->sisa_anggaran ?? 0,
                    'mata_anggarans' => $unit->mataAnggarans->map(function (MataAnggaran $ma) {
                        $totalDetail = $ma->subMataAnggarans->flatMap->detailMataAnggarans->sum('jumlah');

                        return [
                            'id' => $ma->id,
                            'kode' => $ma->kode,
                            'nama' => $ma->nama,
                            'total' => $totalDetail,
                            'apbs_tahun_lalu' => (float) $ma->apbs_tahun_lalu,
                            'asumsi_realisasi' => (float) $ma->asumsi_realisasi,
                            'plafon_apbs' => (float) $ma->asumsi_realisasi * 1.05,
                        ];
                    }),
                ];
            });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Display RAPBS recap for a specific unit.
     */
    public function rekapByUnit(Request $request, Unit $unit): JsonResponse
    {
        $tahun = $request->query('tahun', AcademicYear::current());

        $unit->load([
            'mataAnggarans' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
            'mataAnggarans.subMataAnggarans.detailMataAnggarans' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
            'apbs' => function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            },
        ]);

        $apbs = $unit->apbs->first();

        $mataAnggarans = $unit->mataAnggarans->map(function (MataAnggaran $ma) {
            return [
                'id' => $ma->id,
                'kode' => $ma->kode,
                'nama' => $ma->nama,
                'jenis' => $ma->jenis,
                'sub_mata_anggarans' => $ma->subMataAnggarans->map(function ($sub) {
                    return [
                        'id' => $sub->id,
                        'kode' => $sub->kode,
                        'nama' => $sub->nama,
                        'total' => $sub->detailMataAnggarans->sum('jumlah'),
                        'details' => $sub->detailMataAnggarans->map(function ($detail) {
                            return [
                                'id' => $detail->id,
                                'kode' => $detail->kode,
                                'nama' => $detail->nama,
                                'volume' => $detail->volume,
                                'satuan' => $detail->satuan,
                                'harga_satuan' => $detail->harga_satuan,
                                'jumlah' => $detail->jumlah,
                            ];
                        }),
                    ];
                }),
            ];
        });

        return response()->json([
            'data' => [
                'unit' => [
                    'id' => $unit->id,
                    'kode' => $unit->kode,
                    'nama' => $unit->nama,
                ],
                'apbs' => [
                    'total_anggaran' => $apbs?->total_anggaran ?? 0,
                    'total_realisasi' => $apbs?->total_realisasi ?? 0,
                    'sisa_anggaran' => $apbs?->sisa_anggaran ?? 0,
                ],
                'mata_anggarans' => $mataAnggarans,
            ],
        ]);
    }

    /**
     * Update budget comparison fields for a specific mata anggaran.
     */
    public function updateBudgetComparison(Request $request, MataAnggaran $mataAnggaran): JsonResponse
    {
        $validated = $request->validate([
            'apbs_tahun_lalu' => ['nullable', 'numeric', 'min:0'],
            'asumsi_realisasi' => ['nullable', 'numeric', 'min:0'],
        ]);

        $mataAnggaran->update($validated);

        return response()->json([
            'message' => 'Data perbandingan anggaran berhasil diperbarui.',
            'data' => [
                'id' => $mataAnggaran->id,
                'apbs_tahun_lalu' => (float) $mataAnggaran->apbs_tahun_lalu,
                'asumsi_realisasi' => (float) $mataAnggaran->asumsi_realisasi,
                'plafon_apbs' => (float) $mataAnggaran->asumsi_realisasi * 1.05,
            ],
        ]);
    }
}
