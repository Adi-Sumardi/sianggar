<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Resources\PengajuanResource;
use App\Models\PengajuanAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class PerubahanController extends Controller
{
    /**
     * Display a paginated listing of budget amendments (perubahan).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = Auth::user();
        $query = PengajuanAnggaran::with(['user'])
            ->whereNotNull('status_revisi');

        // Filter by user's own data if unit/substansi role
        if ($user->role->shouldFilterByOwnData()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('unit')) {
            $query->where('unit', $request->query('unit'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('date_revisi')->paginate($perPage);

        return PengajuanResource::collection($items);
    }

    /**
     * Store a new perubahan (budget amendment).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pengajuan_anggaran_id' => ['required', 'integer', 'exists:pengajuan_anggarans,id'],
            'keterangan' => ['required', 'string'],
        ]);

        $pengajuan = PengajuanAnggaran::findOrFail($validated['pengajuan_anggaran_id']);

        $pengajuan->update([
            'status_revisi' => 'perubahan',
            'date_revisi' => now()->toDateString(),
            'time_revisi' => now()->toTimeString(),
        ]);

        $pengajuan->load(['user', 'details', 'approvals']);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil dicatat.',
            'data' => new PengajuanResource($pengajuan),
        ], 201);
    }

    /**
     * Display the specified perubahan.
     */
    public function show(PengajuanAnggaran $perubahan): JsonResponse
    {
        $perubahan->load([
            'user.unit',
            'details.detailMataAnggaran',
            'details.mataAnggaran',
            'approvals.approver',
        ]);

        return response()->json([
            'data' => new PengajuanResource($perubahan),
        ]);
    }

    /**
     * Update the specified perubahan.
     */
    public function update(Request $request, PengajuanAnggaran $perubahan): JsonResponse
    {
        $validated = $request->validate([
            'nama_pengajuan' => ['sometimes', 'required', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $perubahan->update($validated);
        $perubahan->load(['user', 'details']);

        return response()->json([
            'message' => 'Perubahan berhasil diperbarui.',
            'data' => new PengajuanResource($perubahan),
        ]);
    }

    /**
     * Remove the specified perubahan.
     */
    public function destroy(PengajuanAnggaran $perubahan): JsonResponse
    {
        $perubahan->update([
            'status_revisi' => null,
            'date_revisi' => null,
            'time_revisi' => null,
        ]);

        return response()->json([
            'message' => 'Perubahan berhasil dihapus.',
        ]);
    }
}
