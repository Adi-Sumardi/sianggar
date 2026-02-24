<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\StoreMataAnggaranRequest;
use App\Http\Resources\MataAnggaranResource;
use App\Models\MataAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MataAnggaranController extends Controller
{
    /**
     * Display a paginated listing of mata anggaran, filterable by unit_id and tahun.
     * Automatically filters by user's unit if they are Unit/Substansi role.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = MataAnggaran::with('unit')
            ->withCount('subMataAnggarans');

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            // Admin/Approver can filter by specific unit if provided
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderBy('kode')->paginate($perPage);

        return MataAnggaranResource::collection($items);
    }

    /**
     * Store a newly created mata anggaran.
     */
    public function store(StoreMataAnggaranRequest $request): JsonResponse
    {
        $mataAnggaran = MataAnggaran::create($request->validated());
        $mataAnggaran->load('unit');

        return response()->json([
            'message' => 'Mata anggaran berhasil dibuat.',
            'data' => new MataAnggaranResource($mataAnggaran),
        ], 201);
    }

    /**
     * Display the specified mata anggaran.
     */
    public function show(MataAnggaran $mataAnggaran): JsonResponse
    {
        $mataAnggaran->load(['unit', 'subMataAnggarans.detailMataAnggarans']);
        $mataAnggaran->loadCount('subMataAnggarans');

        return response()->json([
            'data' => new MataAnggaranResource($mataAnggaran),
        ]);
    }

    /**
     * Update the specified mata anggaran.
     */
    public function update(StoreMataAnggaranRequest $request, MataAnggaran $mataAnggaran): JsonResponse
    {
        $mataAnggaran->update($request->validated());
        $mataAnggaran->load('unit');

        return response()->json([
            'message' => 'Mata anggaran berhasil diperbarui.',
            'data' => new MataAnggaranResource($mataAnggaran),
        ]);
    }

    /**
     * Remove the specified mata anggaran.
     * Checks for dependencies before deletion.
     */
    public function destroy(MataAnggaran $mataAnggaran): JsonResponse
    {
        // Check if this mata anggaran has any detail pengajuans
        $detailPengajuanCount = $mataAnggaran->detailPengajuans()->count();
        if ($detailPengajuanCount > 0) {
            return response()->json([
                'message' => "Mata anggaran tidak dapat dihapus karena memiliki {$detailPengajuanCount} pengajuan anggaran terkait.",
                'error' => 'has_dependencies',
                'dependencies' => [
                    'detail_pengajuans' => $detailPengajuanCount,
                ],
            ], 422);
        }

        // Check for detail mata anggarans that have pengajuans
        $detailMaWithPengajuan = $mataAnggaran->detailMataAnggarans()
            ->whereHas('detailPengajuans')
            ->count();
        if ($detailMaWithPengajuan > 0) {
            return response()->json([
                'message' => "Mata anggaran tidak dapat dihapus karena memiliki detail mata anggaran dengan pengajuan terkait.",
                'error' => 'has_dependencies',
                'dependencies' => [
                    'detail_mata_anggarans_with_pengajuans' => $detailMaWithPengajuan,
                ],
            ], 422);
        }

        // Safe to delete - cascade will handle sub and detail mata anggarans
        // First delete detail mata anggarans, then sub mata anggarans
        $mataAnggaran->detailMataAnggarans()->delete();
        $mataAnggaran->subMataAnggarans()->delete();
        $mataAnggaran->delete();

        return response()->json([
            'message' => 'Mata anggaran berhasil dihapus.',
        ]);
    }
}
