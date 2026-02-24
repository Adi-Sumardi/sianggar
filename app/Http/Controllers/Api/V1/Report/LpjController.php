<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Report;

use App\Enums\LpjStatus;
use App\Enums\ProposalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ApproveLpjRequest;
use App\Http\Requests\Report\RejectLpjRequest;
use App\Http\Requests\Report\ReviseLpjRequest;
use App\Http\Requests\Report\StoreLpjRequest;
use App\Http\Requests\Report\ValidateLpjRequest;
use App\Http\Resources\LpjResource;
use App\Models\Attachment;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Services\LpjApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class LpjController extends Controller
{
    public function __construct(
        private readonly LpjApprovalService $approvalService,
    ) {
        $this->authorizeResource(Lpj::class, 'lpj');
    }

    /**
     * Display a paginated listing of LPJ with filters.
     * Automatically filters by user's role if they are Unit/Substansi role.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = Lpj::with(['pengajuanAnggaran']);

        // Auto-filter by user's unit_id if they should only see their own data
        // LPJ inherits unit from its PengajuanAnggaran, so filter through the relationship
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->whereHas('pengajuanAnggaran', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        } elseif ($request->filled('unit_id')) {
            // Admin/Approver can filter by specific unit if provided
            $query->whereHas('pengajuanAnggaran', function ($q) use ($request) {
                $q->where('unit_id', $request->query('unit_id'));
            });
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('status')) {
            $query->where('proses', $request->query('status'));
        }

        // Also support 'proses' query param directly
        if ($request->filled('proses')) {
            $query->where('proses', $request->query('proses'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('perihal', 'like', "%{$search}%")
                  ->orWhere('no_surat', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return LpjResource::collection($items);
    }

    /**
     * Store a newly created LPJ (as draft).
     */
    public function store(StoreLpjRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['proses'] = LpjStatus::Draft->value;

        $lpj = Lpj::create($data);
        $lpj->load(['pengajuanAnggaran', 'approvals']);

        return response()->json([
            'message' => 'LPJ berhasil dibuat sebagai draft.',
            'data' => new LpjResource($lpj),
        ], 201);
    }

    /**
     * Submit a draft LPJ for approval.
     */
    public function submit(Request $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('submit', $lpj);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($lpj->proses !== LpjStatus::Draft && $lpj->proses !== LpjStatus::Revised) {
            return response()->json([
                'message' => 'LPJ hanya dapat diajukan dari status draft atau revisi.',
            ], 422);
        }

        $this->approvalService->submit($lpj, $user);

        $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

        return response()->json([
            'message' => 'LPJ berhasil diajukan untuk persetujuan.',
            'data' => new LpjResource($lpj),
        ]);
    }

    /**
     * Display the specified LPJ.
     */
    public function show(Lpj $lpj): JsonResponse
    {
        $lpj->load([
            'pengajuanAnggaran.user',
            'pengajuanAnggaran.detailPengajuans',
            'approvals.approver',
            'attachments',
            'validation.validator',
            'validatedByUser',
        ]);

        return response()->json([
            'data' => new LpjResource($lpj),
        ]);
    }

    /**
     * Update the specified LPJ.
     */
    public function update(Request $request, Lpj $lpj): JsonResponse
    {
        if (! $lpj->canBeEdited()) {
            return response()->json([
                'message' => 'LPJ yang sudah diproses tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'perihal' => ['sometimes', 'required', 'string', 'max:255'],
            'no_surat' => ['nullable', 'string', 'max:100'],
            'mata_anggaran' => ['nullable', 'string', 'max:255'],
            'no_mata_anggaran' => ['nullable', 'string', 'max:100'],
            'tgl_kegiatan' => ['nullable', 'date'],
            'input_realisasi' => ['nullable', 'numeric', 'min:0'],
            'deskripsi_singkat' => ['nullable', 'string'],
            'ditujukan' => ['nullable', 'string', 'max:255'],
        ]);

        $lpj->update($validated);
        $lpj->load(['pengajuanAnggaran', 'approvals']);

        return response()->json([
            'message' => 'LPJ berhasil diperbarui.',
            'data' => new LpjResource($lpj),
        ]);
    }

    /**
     * Resubmit a revised LPJ.
     */
    public function resubmit(Request $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('submit', $lpj);

        if ($lpj->proses !== LpjStatus::Revised) {
            return response()->json([
                'message' => 'LPJ hanya dapat diajukan kembali dari status revisi.',
            ], 422);
        }

        $this->approvalService->resubmit($lpj);
        $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

        return response()->json([
            'message' => 'LPJ berhasil diajukan kembali.',
            'data' => new LpjResource($lpj),
        ]);
    }

    /**
     * Remove the specified LPJ.
     */
    public function destroy(Lpj $lpj): JsonResponse
    {
        if ($lpj->proses !== LpjStatus::Draft) {
            return response()->json([
                'message' => 'Hanya LPJ berstatus draft yang dapat dihapus.',
            ], 422);
        }

        $lpj->delete();

        return response()->json(null, 204);
    }

    // =========================================================================
    // Approval Methods
    // =========================================================================

    /**
     * Validate LPJ (Staf Keuangan stage only).
     * Submits checklist validation and routes to middle approver.
     */
    public function validateLpj(ValidateLpjRequest $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('approve', $lpj);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $validation = $this->approvalService->validate($lpj, $user, $request->validated());

            $lpj->load([
                'pengajuanAnggaran',
                'approvals.approver',
                'validation.validator',
            ]);

            return response()->json([
                'message' => 'LPJ berhasil divalidasi dan dilanjutkan ke tahap berikutnya.',
                'data' => new LpjResource($lpj),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Approve LPJ (middle approver and Keuangan stages).
     */
    public function approve(ApproveLpjRequest $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('approve', $lpj);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $this->approvalService->approve($lpj, $user, $request->input('notes'));

            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            $message = $lpj->proses === LpjStatus::Approved
                ? 'LPJ telah disetujui dan selesai.'
                : 'LPJ berhasil disetujui dan dilanjutkan ke tahap berikutnya.';

            return response()->json([
                'message' => $message,
                'data' => new LpjResource($lpj),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Request revision on LPJ.
     */
    public function revise(ReviseLpjRequest $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('approve', $lpj);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $this->approvalService->revise($lpj, $user, $request->input('notes'));

            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            return response()->json([
                'message' => 'LPJ dikembalikan untuk revisi.',
                'data' => new LpjResource($lpj),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject LPJ.
     */
    public function reject(RejectLpjRequest $request, Lpj $lpj): JsonResponse
    {
        $this->authorize('approve', $lpj);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $this->approvalService->reject($lpj, $user, $request->input('notes'));

            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            return response()->json([
                'message' => 'LPJ telah ditolak.',
                'data' => new LpjResource($lpj),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get approval timeline for LPJ.
     */
    public function timeline(Lpj $lpj): JsonResponse
    {
        $stages = $this->approvalService->getExpectedStages($lpj);

        return response()->json([
            'data' => $stages,
        ]);
    }

    /**
     * Get LPJ statistics for the current user.
     * Returns counts for pending LPJ, revisions needed, and whether new pengajuan can be created.
     */
    public function stats(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Build query for pengajuan that need LPJ
        $pendingLpjQuery = PengajuanAnggaran::where('status_proses', 'paid')
            ->where('need_lpj', true)
            ->where(function ($q) {
                // No LPJ at all, or only rejected LPJ
                $q->whereDoesntHave('lpj')
                    ->orWhereHas('lpj', function ($lpjQuery) {
                        $lpjQuery->where('proses', LpjStatus::Rejected->value);
                    });
            });

        // Filter by user's unit if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $pendingLpjQuery->where('unit_id', $user->unit_id);
        }

        $pendingLpjCount = $pendingLpjQuery->count();

        // Build query for LPJ that need revision
        $revisedLpjQuery = Lpj::where('proses', LpjStatus::Revised->value);

        // Filter by user's unit through pengajuan_anggaran
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $revisedLpjQuery->whereHas('pengajuanAnggaran', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        $revisedLpjCount = $revisedLpjQuery->count();

        // Build query for Pengajuan that need revision
        $revisedPengajuanQuery = PengajuanAnggaran::where('status_proses', ProposalStatus::RevisionRequired->value);

        // Filter by user's unit if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $revisedPengajuanQuery->where('unit_id', $user->unit_id);
        }

        $revisedPengajuanCount = $revisedPengajuanQuery->count();

        // Maximum allowed pending LPJ before blocking new pengajuan creation
        $maxPendingLpj = 20;
        $canCreatePengajuan = $pendingLpjCount < $maxPendingLpj;

        return response()->json([
            'data' => [
                'pending_lpj_count' => $pendingLpjCount,
                'revised_lpj_count' => $revisedLpjCount,
                'revised_pengajuan_count' => $revisedPengajuanCount,
                'can_create_pengajuan' => $canCreatePengajuan,
                'max_pending_lpj' => $maxPendingLpj,
            ],
        ]);
    }

    // =========================================================================
    // Attachment Methods
    // =========================================================================

    /**
     * Upload an attachment for the LPJ.
     */
    public function uploadAttachment(Request $request, Lpj $lpj): JsonResponse
    {
        if (! $lpj->canBeEdited()) {
            return response()->json([
                'message' => 'Tidak dapat menambah lampiran pada LPJ yang sudah diproses.',
            ], 422);
        }

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,jpg,jpeg,png',
            ],
        ]);

        $user = $request->user();
        $file = $validated['file'];

        $path = $file->store("lpj/{$lpj->id}", 'public');

        $attachment = Attachment::create([
            'attachable_type' => Lpj::class,
            'attachable_id' => $lpj->id,
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
     * Delete an attachment from the LPJ.
     */
    public function deleteAttachment(Request $request, Lpj $lpj, Attachment $attachment): JsonResponse
    {
        if ($attachment->attachable_type !== Lpj::class || $attachment->attachable_id !== $lpj->id) {
            return response()->json([
                'message' => 'Attachment tidak ditemukan untuk LPJ ini.',
            ], 404);
        }

        if (! $lpj->canBeEdited()) {
            return response()->json([
                'message' => 'Tidak dapat menghapus lampiran pada LPJ yang sudah diproses.',
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
