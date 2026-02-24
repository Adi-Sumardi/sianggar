<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Requests\PerubahanAnggaran\StorePerubahanAnggaranRequest;
use App\Http\Requests\PerubahanAnggaran\UpdatePerubahanAnggaranRequest;
use App\Http\Requests\Proposal\ApproveRequest;
use App\Http\Requests\Proposal\RejectRequest;
use App\Http\Requests\Proposal\ReviseRequest;
use App\Http\Resources\PerubahanAnggaranResource;
use App\Models\Attachment;
use App\Models\PerubahanAnggaran;
use App\Models\PerubahanAnggaranItem;
use App\Services\PerubahanAnggaranService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PerubahanAnggaranController extends Controller
{
    public function __construct(
        private readonly PerubahanAnggaranService $perubahanService,
    ) {}

    /**
     * Display a paginated listing of perubahan anggarans.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = Auth::user();
        $query = PerubahanAnggaran::with(['user', 'unitRelation', 'items']);

        // Filter by user's own data if unit/substansi role
        if ($user->role->shouldFilterByOwnData()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return PerubahanAnggaranResource::collection($items);
    }

    /**
     * Store a new perubahan anggaran.
     */
    public function store(StorePerubahanAnggaranRequest $request): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validated();

        $perubahan = DB::transaction(function () use ($validated, $user) {
            $perubahan = PerubahanAnggaran::create([
                'nomor_perubahan' => $this->perubahanService->generateNomorPerubahan(),
                'user_id' => $user->id,
                'unit_id' => $user->unit_id,
                'tahun' => $validated['tahun'],
                'perihal' => $validated['perihal'],
                'alasan' => $validated['alasan'],
            ]);

            foreach ($validated['items'] as $itemData) {
                $perubahan->items()->create([
                    'type' => $itemData['type'] ?? 'geser',
                    'source_detail_mata_anggaran_id' => $itemData['source_detail_mata_anggaran_id'] ?? null,
                    'target_detail_mata_anggaran_id' => $itemData['target_detail_mata_anggaran_id'],
                    'amount' => $itemData['amount'],
                    'keterangan' => $itemData['keterangan'] ?? null,
                ]);
            }

            $perubahan->updateTotalAmount();

            return $perubahan;
        });

        $perubahan->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil dibuat.',
            'data' => new PerubahanAnggaranResource($perubahan),
        ], 201);
    }

    /**
     * Display the specified perubahan anggaran.
     */
    public function show(PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        $perubahanAnggaran->load([
            'user',
            'creator',
            'unitRelation',
            'processor',
            'items.sourceDetailMataAnggaran.subMataAnggaran.mataAnggaran',
            'items.targetDetailMataAnggaran.subMataAnggaran.mataAnggaran',
            'logs.sourceDetailMataAnggaran',
            'logs.targetDetailMataAnggaran',
            'logs.executor',
            'approvals.approver',
            'attachments',
        ]);

        return response()->json([
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Update the specified perubahan anggaran.
     */
    public function update(
        UpdatePerubahanAnggaranRequest $request,
        PerubahanAnggaran $perubahanAnggaran,
    ): JsonResponse {
        if (! $perubahanAnggaran->isEditable()) {
            return response()->json([
                'message' => 'Perubahan anggaran tidak dapat diedit pada status ini.',
            ], 422);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($perubahanAnggaran, $validated) {
            if (isset($validated['perihal'])) {
                $perubahanAnggaran->perihal = $validated['perihal'];
            }
            if (isset($validated['alasan'])) {
                $perubahanAnggaran->alasan = $validated['alasan'];
            }
            $perubahanAnggaran->save();

            if (isset($validated['items'])) {
                // Get existing item IDs
                $existingIds = collect($validated['items'])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                // Delete items not in the request
                $perubahanAnggaran->items()
                    ->whereNotIn('id', $existingIds)
                    ->delete();

                // Update or create items
                foreach ($validated['items'] as $itemData) {
                    if (isset($itemData['id'])) {
                        PerubahanAnggaranItem::where('id', $itemData['id'])->update([
                            'type' => $itemData['type'] ?? 'geser',
                            'source_detail_mata_anggaran_id' => $itemData['source_detail_mata_anggaran_id'] ?? null,
                            'target_detail_mata_anggaran_id' => $itemData['target_detail_mata_anggaran_id'],
                            'amount' => $itemData['amount'],
                            'keterangan' => $itemData['keterangan'] ?? null,
                        ]);
                    } else {
                        $perubahanAnggaran->items()->create([
                            'type' => $itemData['type'] ?? 'geser',
                            'source_detail_mata_anggaran_id' => $itemData['source_detail_mata_anggaran_id'] ?? null,
                            'target_detail_mata_anggaran_id' => $itemData['target_detail_mata_anggaran_id'],
                            'amount' => $itemData['amount'],
                            'keterangan' => $itemData['keterangan'] ?? null,
                        ]);
                    }
                }

                $perubahanAnggaran->updateTotalAmount();
            }
        });

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil diperbarui.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Remove the specified perubahan anggaran.
     */
    public function destroy(PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        if (! $perubahanAnggaran->isEditable()) {
            return response()->json([
                'message' => 'Perubahan anggaran tidak dapat dihapus pada status ini.',
            ], 422);
        }

        $perubahanAnggaran->delete();

        return response()->json([
            'message' => 'Perubahan anggaran berhasil dihapus.',
        ]);
    }

    /**
     * Submit a draft perubahan anggaran for approval.
     */
    public function submit(PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        if (! $perubahanAnggaran->isSubmittable()) {
            return response()->json([
                'message' => 'Perubahan anggaran tidak dapat diajukan pada status ini.',
            ], 422);
        }

        try {
            $this->perubahanService->submit($perubahanAnggaran, Auth::user());
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'approvals.approver',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil diajukan.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Resubmit a revised perubahan anggaran.
     */
    public function resubmit(PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        if (! $perubahanAnggaran->isSubmittable()) {
            return response()->json([
                'message' => 'Perubahan anggaran tidak dapat diajukan ulang pada status ini.',
            ], 422);
        }

        try {
            $this->perubahanService->resubmit($perubahanAnggaran);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'approvals.approver',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil diajukan ulang.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Approve the current stage.
     */
    public function approve(ApproveRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        try {
            $approval = $this->perubahanService->approve(
                $perubahanAnggaran,
                Auth::user(),
                $request->validated()['notes'] ?? null,
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'logs.sourceDetailMataAnggaran',
            'logs.targetDetailMataAnggaran',
            'logs.executor',
            'approvals.approver',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran berhasil disetujui.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Request revision.
     */
    public function revise(ReviseRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        try {
            $approval = $this->perubahanService->revise(
                $perubahanAnggaran,
                Auth::user(),
                $request->validated()['notes'],
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'approvals.approver',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran dikembalikan untuk revisi.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Reject the perubahan anggaran.
     */
    public function reject(RejectRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        try {
            $approval = $this->perubahanService->reject(
                $perubahanAnggaran,
                Auth::user(),
                $request->validated()['notes'],
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $perubahanAnggaran->load([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'approvals.approver',
        ]);

        return response()->json([
            'message' => 'Perubahan anggaran ditolak.',
            'data' => new PerubahanAnggaranResource($perubahanAnggaran),
        ]);
    }

    /**
     * Get approval queue for current user.
     */
    public function approvalQueue(Request $request): AnonymousResourceCollection
    {
        $user = Auth::user();
        $approvals = $this->perubahanService->getPendingForRole($user);

        // Extract the perubahan anggarans from approvals
        $perubahanIds = $approvals->pluck('approvable_id')->unique();
        $perubahans = PerubahanAnggaran::with([
            'user',
            'unitRelation',
            'items.sourceDetailMataAnggaran',
            'items.targetDetailMataAnggaran',
            'approvals.approver',
        ])
            ->whereIn('id', $perubahanIds)
            ->orderByDesc('created_at')
            ->get();

        return PerubahanAnggaranResource::collection($perubahans);
    }

    /**
     * Get expected stages for a perubahan anggaran.
     */
    public function expectedStages(PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        $perubahanAnggaran->load(['approvals.approver']);

        $stages = $this->perubahanService->getExpectedStages($perubahanAnggaran);

        return response()->json([
            'data' => $stages,
        ]);
    }

    /**
     * Upload an attachment for the perubahan anggaran.
     */
    public function uploadAttachment(Request $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse
    {
        if (! $perubahanAnggaran->isEditable()) {
            return response()->json([
                'message' => 'Tidak dapat menambah lampiran pada perubahan anggaran yang sudah diproses.',
            ], 422);
        }

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf',
            ],
        ]);

        $user = Auth::user();
        $file = $validated['file'];

        $path = $file->store("perubahan-anggaran/{$perubahanAnggaran->id}", 'public');

        $attachment = Attachment::create([
            'attachable_type' => PerubahanAnggaran::class,
            'attachable_id' => $perubahanAnggaran->id,
            'uploaded_by' => $user->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_mime' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'File berhasil diupload.',
            'data' => $attachment,
        ], 201);
    }

    /**
     * Delete an attachment from the perubahan anggaran.
     */
    public function deleteAttachment(Request $request, PerubahanAnggaran $perubahanAnggaran, Attachment $attachment): JsonResponse
    {
        if ($attachment->attachable_type !== PerubahanAnggaran::class || $attachment->attachable_id !== $perubahanAnggaran->id) {
            return response()->json([
                'message' => 'Attachment tidak ditemukan untuk perubahan anggaran ini.',
            ], 404);
        }

        if (! $perubahanAnggaran->isEditable()) {
            return response()->json([
                'message' => 'Tidak dapat menghapus lampiran pada perubahan anggaran yang sudah diproses.',
            ], 422);
        }

        if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'File berhasil dihapus.',
        ]);
    }
}
