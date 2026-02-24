<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Report;

use App\Exports\CoaExport;
use App\Helpers\AcademicYear;
use App\Http\Controllers\Controller;
use App\Http\Resources\PenerimaanResource;
use App\Http\Resources\RealisasiAnggaranResource;
use App\Models\MataAnggaran;
use App\Models\Penerimaan;
use App\Models\RealisasiAnggaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AccountingController extends Controller
{
    /**
     * Get Chart of Accounts (COA) grouped by unit.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function coaByUnit(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = MataAnggaran::with([
            'unit',
            'subMataAnggarans.detailMataAnggarans',
        ]);

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            // Admin/Approver can filter by specific unit if provided
            $query->where('unit_id', $request->query('unit_id'));
        }

        $mataAnggarans = $query->orderBy('kode')->get();

        $grouped = $mataAnggarans->groupBy('unit_id')->map(function ($items, $unitId) {
            $unit = $items->first()->unit;

            return [
                'unit_id' => $unitId,
                'unit_kode' => $unit?->kode,
                'unit_nama' => $unit?->nama,
                'mata_anggarans' => $items->map(function (MataAnggaran $ma) {
                    return [
                        'id' => $ma->id,
                        'kode' => $ma->kode,
                        'nama' => $ma->nama,
                        'jenis' => $ma->jenis,
                        'sub_count' => $ma->subMataAnggarans->count(),
                        'total' => $ma->subMataAnggarans
                            ->flatMap->detailMataAnggarans
                            ->sum('jumlah'),
                    ];
                }),
            ];
        })->values();

        return response()->json([
            'data' => $grouped,
        ]);
    }

    /**
     * List penerimaan records filtered by user's unit.
     */
    public function indexPenerimaan(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Penerimaan::with('unit');

        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json(PenerimaanResource::collection($items)->response()->getData(true));
    }

    /**
     * List realisasi records filtered by user's unit.
     */
    public function indexRealisasi(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = RealisasiAnggaran::with('unit');

        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json(RealisasiAnggaranResource::collection($items)->response()->getData(true));
    }

    /**
     * Store a new penerimaan record.
     */
    public function storePenerimaan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:9'],
            'bulan' => ['required', 'string', 'max:20'],
            'sumber' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $penerimaan = Penerimaan::create($validated);
        $penerimaan->load('unit');

        return response()->json([
            'message' => 'Penerimaan berhasil dicatat.',
            'data' => new PenerimaanResource($penerimaan),
        ], 201);
    }

    /**
     * Update a penerimaan record.
     */
    public function updatePenerimaan(Request $request, Penerimaan $penerimaan): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['sometimes', 'required', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['sometimes', 'required', 'string', 'max:9'],
            'bulan' => ['sometimes', 'required', 'string', 'max:20'],
            'sumber' => ['sometimes', 'required', 'string', 'max:255'],
            'jumlah' => ['sometimes', 'required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $penerimaan->update($validated);
        $penerimaan->load('unit');

        return response()->json([
            'message' => 'Penerimaan berhasil diperbarui.',
            'data' => new PenerimaanResource($penerimaan),
        ]);
    }

    /**
     * Remove a penerimaan record.
     */
    public function destroyPenerimaan(Penerimaan $penerimaan): JsonResponse
    {
        $penerimaan->delete();

        return response()->json([
            'message' => 'Penerimaan berhasil dihapus.',
        ]);
    }

    /**
     * Store a new realisasi record.
     */
    public function storeRealisasi(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:9'],
            'bulan' => ['required', 'string', 'max:20'],
            'jumlah_anggaran' => ['required', 'numeric', 'min:0'],
            'jumlah_realisasi' => ['required', 'numeric', 'min:0'],
            'sisa' => ['nullable', 'numeric'],
            'persentase' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string'],
        ]);

        // Unit roles can only create realisasi for their own unit
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null && (int) $validated['unit_id'] !== $user->unit_id) {
            return response()->json([
                'message' => 'Anda hanya dapat menambah realisasi untuk unit Anda sendiri.',
            ], 403);
        }

        $realisasi = RealisasiAnggaran::create($validated);
        $realisasi->load('unit');

        return response()->json([
            'message' => 'Realisasi anggaran berhasil dicatat.',
            'data' => new RealisasiAnggaranResource($realisasi),
        ], 201);
    }

    /**
     * Update a realisasi record.
     */
    public function updateRealisasi(Request $request, RealisasiAnggaran $realisasi): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Unit roles can only update realisasi for their own unit
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null && $realisasi->unit_id !== $user->unit_id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk mengubah realisasi unit lain.',
            ], 403);
        }

        $validated = $request->validate([
            'unit_id' => ['sometimes', 'required', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['sometimes', 'required', 'string', 'max:9'],
            'bulan' => ['sometimes', 'required', 'string', 'max:20'],
            'jumlah_anggaran' => ['sometimes', 'required', 'numeric', 'min:0'],
            'jumlah_realisasi' => ['sometimes', 'required', 'numeric', 'min:0'],
            'sisa' => ['nullable', 'numeric'],
            'persentase' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $realisasi->update($validated);
        $realisasi->load('unit');

        return response()->json([
            'message' => 'Realisasi anggaran berhasil diperbarui.',
            'data' => new RealisasiAnggaranResource($realisasi),
        ]);
    }

    /**
     * Remove a realisasi record.
     */
    public function destroyRealisasi(Request $request, RealisasiAnggaran $realisasi): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Unit roles can only delete realisasi for their own unit
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null && $realisasi->unit_id !== $user->unit_id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk menghapus realisasi unit lain.',
            ], 403);
        }

        $realisasi->delete();

        return response()->json([
            'message' => 'Realisasi anggaran berhasil dihapus.',
        ]);
    }

    /**
     * Export COA to Excel.
     */
    public function exportCoaExcel(Request $request): BinaryFileResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $unitId = null;
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $unitId = $user->unit_id;
        } elseif ($request->filled('unit_id')) {
            $unitId = (int) $request->query('unit_id');
        }

        $tahun = $request->query('tahun');
        $fileName = 'COA_' . date('Y-m-d') . '.xlsx';

        return Excel::download(
            new CoaExport($unitId, $tahun),
            $fileName
        );
    }

    /**
     * Export COA to PDF.
     */
    public function exportCoaPdf(Request $request): \Illuminate\Http\Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = MataAnggaran::with([
            'unit',
            'subMataAnggarans.detailMataAnggarans',
        ]);

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        $mataAnggarans = $query->orderBy('unit_id')->orderBy('kode')->get();

        // Group by unit for the view
        $data = $mataAnggarans->groupBy('unit_id')->map(function ($items, $unitId) {
            $unit = $items->first()->unit;

            return [
                'unit_id' => $unitId,
                'unit_kode' => $unit?->kode,
                'unit_nama' => $unit?->nama ?? 'Unit',
                'mata_anggarans' => $items->map(function (MataAnggaran $ma) {
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
                                'detail_mata_anggarans' => $sub->detailMataAnggarans->map(function ($detail) {
                                    return [
                                        'id' => $detail->id,
                                        'kode' => $detail->kode,
                                        'nama' => $detail->nama,
                                        'volume' => $detail->volume,
                                        'satuan' => $detail->satuan,
                                        'harga_satuan' => $detail->harga_satuan,
                                        'jumlah' => $detail->jumlah,
                                    ];
                                })->toArray(),
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ];
        })->values()->toArray();

        $tahun = $request->query('tahun', AcademicYear::current());
        $pdf = Pdf::loadView('reports.coa', [
            'data' => $data,
            'tahun' => $tahun,
        ]);

        $pdf->setPaper('a4', 'landscape');
        $fileName = 'COA_' . date('Y-m-d') . '.pdf';

        return $pdf->download($fileName);
    }
}
