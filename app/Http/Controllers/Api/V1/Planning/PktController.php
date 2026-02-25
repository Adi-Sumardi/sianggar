<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Planning;

use App\Http\Controllers\Controller;
use App\Http\Resources\PktResource;
use App\Models\Pkt;
use App\Models\Rapbs;
use App\Services\PktService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PktController extends Controller
{
    public function __construct(
        private PktService $pktService
    ) {}

    /**
     * Display a paginated listing of PKT with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Pkt::with([
            'strategy',
            'indikator',
            'proker',
            'kegiatan',
            'mataAnggaran',
            'subMataAnggaran',
            'detailMataAnggaran',
            'unitRelation',
            'creator',
        ]);

        // Filter by user's unit if not admin/approver
        if ($user->role->shouldFilterByOwnData()) {
            $query->where('unit_id', $user->unit_id);
        }

        // Filter by unit_id if provided
        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        // Filter by tahun
        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        // Filter by strategy
        if ($request->filled('strategy_id')) {
            $query->where('strategy_id', $request->query('strategy_id'));
        }

        if ($request->filled('proker_id')) {
            $query->where('proker_id', $request->query('proker_id'));
        }

        if ($request->filled('kegiatan_id')) {
            $query->where('kegiatan_id', $request->query('kegiatan_id'));
        }

        if ($request->filled('mata_anggaran_id')) {
            $query->where('mata_anggaran_id', $request->query('mata_anggaran_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('deskripsi_kegiatan', 'like', "%{$search}%")
                  ->orWhere('tujuan_kegiatan', 'like', "%{$search}%")
                  ->orWhere('unit', 'like', "%{$search}%")
                  ->orWhereHas('kegiatan', fn ($kq) => $kq->where('nama', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return PktResource::collection($items);
    }

    /**
     * Store a newly created PKT.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'strategy_id' => ['required', 'integer', Rule::exists('strategies', 'id')],
            'indikator_id' => ['required', 'integer', Rule::exists('indikators', 'id')],
            'proker_id' => ['required', 'integer', Rule::exists('prokers', 'id')],
            'kegiatan_id' => ['required', 'integer', Rule::exists('kegiatans', 'id')],
            'mata_anggaran_id' => ['required', 'integer', Rule::exists('mata_anggarans', 'id')],
            'sub_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('sub_mata_anggarans', 'id')],
            'detail_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('detail_mata_anggarans', 'id')],
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
            'unit' => ['nullable', 'string', 'max:50'], // Legacy string field
            'deskripsi_kegiatan' => ['nullable', 'string'],
            'tujuan_kegiatan' => ['nullable', 'string'],
            'saldo_anggaran' => ['required', 'numeric', 'min:0'],
            'volume' => ['nullable', 'numeric', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
        ]);

        if ($error = $this->checkRapbsLocked($validated['unit_id'] ?? $request->user()->unit_id, $validated['tahun'])) {
            return $error;
        }

        $pkt = $this->pktService->create($validated, $request->user());

        $pkt->load([
            'strategy',
            'indikator',
            'proker',
            'kegiatan',
            'mataAnggaran',
            'subMataAnggaran',
            'detailMataAnggaran',
            'unitRelation',
            'creator',
        ]);

        return response()->json([
            'message' => 'PKT berhasil dibuat.',
            'data' => new PktResource($pkt),
        ], 201);
    }

    /**
     * Display the specified PKT.
     */
    public function show(Pkt $pkt): JsonResponse
    {
        $pkt->load([
            'strategy',
            'indikator',
            'proker',
            'kegiatan',
            'mataAnggaran',
            'subMataAnggaran',
            'detailMataAnggaran',
            'unitRelation',
            'creator',
        ]);

        return response()->json([
            'data' => new PktResource($pkt),
        ]);
    }

    /**
     * Update the specified PKT.
     */
    public function update(Request $request, Pkt $pkt): JsonResponse
    {
        if (!$pkt->isDraft()) {
            return response()->json([
                'message' => 'Hanya PKT dengan status draft yang dapat diperbarui.',
            ], 403);
        }

        if ($error = $this->checkRapbsLocked($pkt->unit_id, $pkt->tahun)) {
            return $error;
        }

        $validated = $request->validate([
            'strategy_id' => ['sometimes', 'required', 'integer', Rule::exists('strategies', 'id')],
            'indikator_id' => ['sometimes', 'required', 'integer', Rule::exists('indikators', 'id')],
            'proker_id' => ['sometimes', 'required', 'integer', Rule::exists('prokers', 'id')],
            'kegiatan_id' => ['sometimes', 'required', 'integer', Rule::exists('kegiatans', 'id')],
            'mata_anggaran_id' => ['sometimes', 'required', 'integer', Rule::exists('mata_anggarans', 'id')],
            'sub_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('sub_mata_anggarans', 'id')],
            'detail_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('detail_mata_anggarans', 'id')],
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['sometimes', 'required', 'string', 'max:10'],
            'unit' => ['nullable', 'string', 'max:50'],
            'deskripsi_kegiatan' => ['nullable', 'string'],
            'tujuan_kegiatan' => ['nullable', 'string'],
            'saldo_anggaran' => ['sometimes', 'required', 'numeric', 'min:0'],
            'volume' => ['nullable', 'numeric', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
        ]);

        $pkt = $this->pktService->update($pkt, $validated, $request->user());

        $pkt->load([
            'strategy',
            'indikator',
            'proker',
            'kegiatan',
            'mataAnggaran',
            'subMataAnggaran',
            'detailMataAnggaran',
            'unitRelation',
            'creator',
        ]);

        return response()->json([
            'message' => 'PKT berhasil diperbarui.',
            'data' => new PktResource($pkt),
        ]);
    }

    /**
     * Remove the specified PKT.
     */
    public function destroy(Request $request, Pkt $pkt): JsonResponse
    {
        if (!$pkt->isDraft()) {
            return response()->json([
                'message' => 'Hanya PKT dengan status draft yang dapat dihapus.',
            ], 403);
        }

        if ($error = $this->checkRapbsLocked($pkt->unit_id, $pkt->tahun)) {
            return $error;
        }

        $this->pktService->delete($pkt, $request->user());

        return response()->json(null, 204);
    }

    /**
     * Submit PKT.
     */
    public function submit(Request $request, Pkt $pkt): JsonResponse
    {
        if ($pkt->status !== 'draft') {
            return response()->json([
                'message' => 'PKT hanya dapat disubmit saat status draft.',
            ], 422);
        }

        $pkt = $this->pktService->submit($pkt, $request->user());

        return response()->json([
            'message' => 'PKT berhasil disubmit.',
            'data' => new PktResource($pkt),
        ]);
    }

    /**
     * Check if the unit's RAPBS is locked (not editable).
     */
    private function checkRapbsLocked(?int $unitId, string $tahun): ?JsonResponse
    {
        $rapbs = Rapbs::where('unit_id', $unitId)->where('tahun', $tahun)->first();

        if ($rapbs && !$rapbs->canEdit()) {
            $message = $rapbs->status->isFullyApproved()
                ? 'RAPBS sudah diapprove, pengisian PKT ditutup.'
                : 'Tidak dapat mengubah PKT karena RAPBS sedang dalam proses pengajuan. Tunggu hingga RAPBS selesai diproses atau direvisi.';

            return response()->json([
                'message' => $message,
            ], 422);
        }

        return null;
    }
}
