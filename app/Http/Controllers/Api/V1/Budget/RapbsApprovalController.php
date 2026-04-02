<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Enums\RapbsStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\RapbsResource;
use App\Models\Rapbs;
use App\Services\RapbsApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RapbsApprovalController extends Controller
{
    public function __construct(
        private RapbsApprovalService $approvalService
    ) {}

    /**
     * List RAPBS for current user's unit.
     * Shows all RAPBS with their status for submission/tracking.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Rapbs::with(['unit.mataAnggarans', 'submitter', 'items'])
            ->withCount('items');

        // Filter by user's unit if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = (int) $request->query('per_page', '15');
        $rapbs = $query->orderByDesc('created_at')->paginate($perPage);

        return RapbsResource::collection($rapbs);
    }

    /**
     * Get pending approvals for current user.
     */
    public function pending(Request $request): AnonymousResourceCollection
    {
        $pending = $this->approvalService->getPendingForUser($request->user());

        return RapbsResource::collection($pending);
    }

    /**
     * Get RAPBS detail with approval history.
     */
    public function show(Rapbs $rapbs, Request $request): JsonResponse
    {
        $rapbs->load([
            'unit.mataAnggarans',
            'items.mataAnggaran',
            'items.subMataAnggaran',
            'items.detailMataAnggaran',
            'items.pkt.strategy',
            'items.pkt.indikator',
            'items.pkt.proker',
            'items.pkt.kegiatan',
            'items.pkt.mataAnggaran',
            'items.pkt.subMataAnggaran',
            'items.pkt.detailMataAnggaran',
            'approvals.user',
            'currentApproval.user',
            'submitter',
            'approver',
        ]);

        $canApprove = $this->approvalService->canApprove($rapbs, $request->user());

        return response()->json([
            'data' => new RapbsResource($rapbs),
            'can_approve' => $canApprove,
        ]);
    }

    /**
     * Submit RAPBS for approval.
     */
    public function submit(Rapbs $rapbs, Request $request): JsonResponse
    {
        $rapbs->load('unit.mataAnggarans');

        if (!$rapbs->canSubmit()) {
            return response()->json([
                'message' => 'RAPBS tidak dapat disubmit. Pastikan status draft dan memiliki item.',
            ], 422);
        }

        if ($rapbs->isOverBudget()) {
            return response()->json([
                'message' => 'Total Anggaran melebihi Total Plafon. Sesuaikan anggaran terlebih dahulu.',
            ], 422);
        }

        $this->approvalService->submit($rapbs, $request->user());

        return response()->json([
            'message' => 'RAPBS berhasil diajukan untuk approval',
            'data' => new RapbsResource($rapbs->fresh(['unit.mataAnggarans', 'currentApproval', 'submitter'])),
        ]);
    }

    /**
     * Approve current stage.
     */
    public function approve(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->approvalService->approve($rapbs, $request->user(), $validated['notes'] ?? null);

            return response()->json([
                'message' => 'RAPBS berhasil disetujui',
                'data' => new RapbsResource($rapbs->fresh(['unit.mataAnggarans', 'approvals', 'currentApproval', 'submitter'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Request revision.
     */
    public function revise(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $this->approvalService->revise($rapbs, $request->user(), $validated['notes']);

            return response()->json([
                'message' => 'RAPBS dikembalikan untuk revisi',
                'data' => new RapbsResource($rapbs->fresh(['unit.mataAnggarans', 'approvals', 'submitter'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Reject RAPBS.
     */
    public function reject(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $this->approvalService->reject($rapbs, $request->user(), $validated['notes']);

            return response()->json([
                'message' => 'RAPBS ditolak',
                'data' => new RapbsResource($rapbs->fresh(['unit.mataAnggarans', 'approvals', 'submitter'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Update keterangan (notes/justification) for a RAPBS.
     * Only the owning unit (or admin) can update, and only while status is Draft.
     */
    public function updateKeterangan(Rapbs $rapbs, Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->role !== UserRole::Admin) {
            if ($rapbs->unit_id !== $user->unit_id) {
                return response()->json([
                    'message' => 'Anda tidak memiliki akses untuk mengubah keterangan RAPBS ini.',
                ], 403);
            }

            if ($rapbs->status !== RapbsStatus::Draft) {
                return response()->json([
                    'message' => 'Keterangan hanya dapat diubah saat RAPBS berstatus Draft.',
                ], 422);
            }
        }

        $validated = $request->validate([
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ]);

        $rapbs->update(['keterangan' => $validated['keterangan']]);

        return response()->json([
            'message' => 'Keterangan berhasil diperbarui.',
            'data' => ['keterangan' => $rapbs->keterangan],
        ]);
    }

    /**
     * Get approval history.
     */
    public function history(Rapbs $rapbs): JsonResponse
    {
        $history = $this->approvalService->getApprovalHistory($rapbs);

        return response()->json([
            'data' => $history->map(fn ($approval) => [
                'id' => $approval->id,
                'stage' => $approval->stage->value,
                'stage_label' => $approval->stage->label(),
                'stage_order' => $approval->stage_order,
                'status' => $approval->status,
                'notes' => $approval->notes,
                'acted_at' => $approval->acted_at?->toIso8601String(),
                'user' => $approval->user ? [
                    'id' => $approval->user->id,
                    'name' => $approval->user->name,
                    'role' => $approval->user->role->value,
                    'role_label' => $approval->user->role->label(),
                ] : null,
            ]),
        ]);
    }
}
