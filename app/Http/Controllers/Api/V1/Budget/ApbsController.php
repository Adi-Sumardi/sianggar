<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\StoreApbsRequest;
use App\Http\Resources\ApbsResource;
use App\Models\Apbs;
use App\Models\DetailMataAnggaran;
use App\Models\Rapbs;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApbsController extends Controller
{
    /**
     * Display a paginated listing of APBS, filterable by unit_id and tahun.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = Apbs::with('unit');

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
            $query->where('status', $request->query('status'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('tahun')->paginate($perPage);

        $this->applyLiveTotals($items->getCollection());

        return ApbsResource::collection($items);
    }

    /**
     * Selaraskan total_anggaran & sisa_anggaran APBS dengan total RAPBS terkini,
     * yaitu penjumlahan detail mata anggaran per unit & tahun (sama dengan halaman RAPBS).
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, \App\Models\Apbs>  $apbsList
     */
    private function applyLiveTotals(EloquentCollection $apbsList): void
    {
        if ($apbsList->isEmpty()) {
            return;
        }

        $unitIds = $apbsList->pluck('unit_id')->unique()->values();
        $tahuns = $apbsList->pluck('tahun')->unique()->values();

        $totals = DetailMataAnggaran::query()
            ->join('mata_anggarans', 'detail_mata_anggarans.mata_anggaran_id', '=', 'mata_anggarans.id')
            ->whereIn('mata_anggarans.unit_id', $unitIds)
            ->whereIn('mata_anggarans.tahun', $tahuns)
            ->groupBy('mata_anggarans.unit_id', 'mata_anggarans.tahun')
            ->selectRaw('mata_anggarans.unit_id, mata_anggarans.tahun, SUM(detail_mata_anggarans.jumlah) as total')
            ->get()
            ->keyBy(fn ($row) => $row->unit_id.'|'.$row->tahun);

        foreach ($apbsList as $apbs) {
            $row = $totals->get($apbs->unit_id.'|'.$apbs->tahun);

            // Tidak ada data mata anggaran untuk unit+tahun ini → pertahankan
            // nilai tersimpan (jangan timpa dengan 0).
            if ($row === null) {
                continue;
            }

            $total = (float) $row->total;
            $apbs->total_anggaran = $total;
            $apbs->sisa_anggaran = $total - (float) $apbs->total_realisasi;
        }
    }

    /**
     * Store a newly created APBS from an approved RAPBS.
     */
    public function store(StoreApbsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $rapbs = Rapbs::findOrFail($validated['rapbs_id']);

        $apbs = Apbs::create([
            'rapbs_id' => $rapbs->id,
            'unit_id' => $rapbs->unit_id,
            'tahun' => $rapbs->tahun,
            'total_anggaran' => $rapbs->total_anggaran ?? 0,
            'total_realisasi' => 0,
            'sisa_anggaran' => $rapbs->total_anggaran ?? 0,
            'nomor_dokumen' => $validated['nomor_dokumen'] ?? null,
            'tanggal_pengesahan' => $validated['tanggal_pengesahan'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
            'status' => 'active',
        ]);
        $apbs->load('unit');

        return response()->json([
            'message' => 'APBS berhasil dibuat.',
            'data' => new ApbsResource($apbs),
        ], 201);
    }

    /**
     * Display the specified APBS.
     */
    public function show(Apbs $apb): JsonResponse
    {
        $apb->load(['unit', 'rapbs']);
        $this->applyLiveTotals(new EloquentCollection([$apb]));

        return response()->json([
            'data' => new ApbsResource($apb),
        ]);
    }

    /**
     * Update the specified APBS.
     */
    public function update(StoreApbsRequest $request, Apbs $apb): JsonResponse
    {
        if ($apb->isClosed()) {
            return response()->json([
                'message' => 'APBS yang sudah ditutup tidak dapat diperbarui.',
            ], 403);
        }

        $apb->update($request->validated());
        $apb->load('unit');

        return response()->json([
            'message' => 'APBS berhasil diperbarui.',
            'data' => new ApbsResource($apb),
        ]);
    }

    /**
     * Remove the specified APBS.
     */
    public function destroy(Apbs $apb): JsonResponse
    {
        if ($apb->isActive()) {
            return response()->json([
                'message' => 'APBS yang aktif tidak dapat dihapus.',
            ], 403);
        }

        $apb->delete();

        return response()->json(null, 204);
    }
}
