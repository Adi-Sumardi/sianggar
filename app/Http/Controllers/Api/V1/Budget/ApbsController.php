<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\StoreApbsRequest;
use App\Http\Resources\ApbsResource;
use App\Models\Apbs;
use App\Models\Rapbs;
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

        return ApbsResource::collection($items);
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
