<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\StoreSubMataAnggaranRequest;
use App\Http\Resources\SubMataAnggaranResource;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubMataAnggaranController extends Controller
{
    /**
     * Display a listing of sub mata anggaran for a given mata anggaran.
     */
    public function index(Request $request, MataAnggaran $mataAnggaran): AnonymousResourceCollection
    {
        $query = $mataAnggaran->subMataAnggarans()
            ->with('unit');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderBy('kode')->paginate($perPage);

        return SubMataAnggaranResource::collection($items);
    }

    /**
     * Store a newly created sub mata anggaran (standalone route).
     */
    public function store(StoreSubMataAnggaranRequest $request): JsonResponse
    {
        $data = $request->validated();

        $subMataAnggaran = SubMataAnggaran::create($data);
        $subMataAnggaran->load(['mataAnggaran', 'unit']);

        return response()->json([
            'message' => 'Sub mata anggaran berhasil dibuat.',
            'data' => new SubMataAnggaranResource($subMataAnggaran),
        ], 201);
    }

    /**
     * Display the specified sub mata anggaran (standalone route).
     */
    public function show(SubMataAnggaran $subMataAnggaran): JsonResponse
    {
        $subMataAnggaran->load(['mataAnggaran', 'unit', 'detailMataAnggarans']);

        return response()->json([
            'data' => new SubMataAnggaranResource($subMataAnggaran),
        ]);
    }

    /**
     * Update the specified sub mata anggaran (standalone route).
     */
    public function update(StoreSubMataAnggaranRequest $request, SubMataAnggaran $subMataAnggaran): JsonResponse
    {
        $subMataAnggaran->update($request->validated());
        $subMataAnggaran->load(['mataAnggaran', 'unit']);

        return response()->json([
            'message' => 'Sub mata anggaran berhasil diperbarui.',
            'data' => new SubMataAnggaranResource($subMataAnggaran),
        ]);
    }

    /**
     * Remove the specified sub mata anggaran (standalone route).
     * Checks for dependencies before deletion.
     */
    public function destroy(SubMataAnggaran $subMataAnggaran): JsonResponse
    {
        // Check if any detail mata anggarans have pengajuans
        $detailMaWithPengajuan = $subMataAnggaran->detailMataAnggarans()
            ->whereHas('detailPengajuans')
            ->count();
        if ($detailMaWithPengajuan > 0) {
            return response()->json([
                'message' => "Sub mata anggaran tidak dapat dihapus karena memiliki detail mata anggaran dengan pengajuan terkait.",
                'error' => 'has_dependencies',
                'dependencies' => [
                    'detail_mata_anggarans_with_pengajuans' => $detailMaWithPengajuan,
                ],
            ], 422);
        }

        // Safe to delete - delete lampiran first, then detail mata anggarans
        foreach ($subMataAnggaran->detailMataAnggarans as $detail) {
            $detail->lampiranMataAnggarans()->delete();
        }
        $subMataAnggaran->lampiranMataAnggarans()->delete();
        $subMataAnggaran->detailMataAnggarans()->delete();
        $subMataAnggaran->delete();

        return response()->json([
            'message' => 'Sub mata anggaran berhasil dihapus.',
        ]);
    }
}
