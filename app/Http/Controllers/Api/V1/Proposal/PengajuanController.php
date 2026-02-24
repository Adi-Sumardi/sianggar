<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proposal\StorePengajuanRequest;
use App\Http\Resources\PengajuanResource;
use App\Models\Attachment;
use App\Models\DetailPengajuan;
use App\Models\PengajuanAnggaran;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PengajuanController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {
        $this->authorizeResource(PengajuanAnggaran::class, 'pengajuan');
    }

    /**
     * Get pengajuan available for LPJ creation.
     * Returns pengajuan that:
     * - Have status 'paid' AND need_lpj = true
     * - Don't have an existing active LPJ (only rejected LPJ is allowed)
     */
    public function availableForLpj(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = PengajuanAnggaran::with(['user', 'unitRelation'])
            ->where('status_proses', 'paid')
            ->where('need_lpj', true)
            ->where(function ($q) {
                // No LPJ exists OR all existing LPJs are rejected
                $q->whereDoesntHave('lpj')
                    ->orWhereHas('lpj', function ($lpjQuery) {
                        $lpjQuery->where('proses', 'rejected');
                    });
            });

        // Auto-filter by user's unit_id if they should only see their own data
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        $items = $query->orderByDesc('updated_at')->get();

        return PengajuanResource::collection($items);
    }

    /**
     * Display a paginated listing of pengajuan with filters.
     * Automatically filters by user's role if they are Unit/Substansi role.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = PengajuanAnggaran::with(['user']);

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
            $query->where('status_proses', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_pengajuan', 'like', "%{$search}%")
                  ->orWhere('no_surat', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return PengajuanResource::collection($items);
    }

    /**
     * Store a newly created pengajuan as draft (no auto-submit).
     */
    public function store(StorePengajuanRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validated();

        $pengajuan = DB::transaction(function () use ($data, $user) {
            $details = $data['details'];
            unset($data['details']);

            $data['user_id'] = $user->id;
            $data['unit_id'] = $user->unit_id;
            // Set unit name from user's unit relationship
            if ($user->unit_id !== null) {
                $unit = \App\Models\Unit::find($user->unit_id);
                $data['unit'] = $unit?->nama;
            }
            $data['status_proses'] = 'draft';

            $pengajuan = PengajuanAnggaran::create($data);

            $totalJumlah = 0;

            foreach ($details as $detail) {
                $detail['pengajuan_anggaran_id'] = $pengajuan->id;
                DetailPengajuan::create($detail);
                $totalJumlah += (float) $detail['jumlah'];
            }

            $pengajuan->update([
                'jumlah_pengajuan_total' => $totalJumlah,
            ]);

            return $pengajuan;
        });

        $pengajuan->load(['user', 'detailPengajuans']);

        return response()->json([
            'message' => 'Pengajuan berhasil dibuat sebagai draft.',
            'data' => new PengajuanResource($pengajuan),
        ], 201);
    }

    /**
     * Submit a draft pengajuan for approval.
     */
    public function submit(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('submit', $pengajuan);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if ($status !== 'draft') {
            return response()->json([
                'message' => 'Hanya pengajuan berstatus draft yang dapat disubmit.',
            ], 422);
        }

        try {
            $this->approvalService->submit($pengajuan, $user);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $pengajuan->refresh();
        $pengajuan->load(['user', 'detailPengajuans', 'approvals']);

        return response()->json([
            'message' => 'Pengajuan berhasil diajukan untuk approval.',
            'data' => new PengajuanResource($pengajuan),
        ]);
    }

    /**
     * Display the specified pengajuan with eager loaded relationships.
     */
    public function show(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('view', $pengajuan);

        $pengajuan->load([
            'user.unit',
            'unitRelation',
            'detailPengajuans.detailMataAnggaran',
            'detailPengajuans.mataAnggaran',
            'detailPengajuans.subMataAnggaran',
            'approvals.approver',
            'attachments',
            'financeValidation.validator',
            'discussions.opener',
            'discussions.closer',
            'discussions.messages.user',
            'amountEditLogs.editor',
        ]);

        // Add expected stages from routing engine
        $expectedStages = $this->approvalService->getExpectedStages($pengajuan);

        return response()->json([
            'data' => new PengajuanResource($pengajuan),
            'expected_stages' => $expectedStages,
        ]);
    }

    /**
     * Get approval history for a pengajuan.
     */
    public function approvals(PengajuanAnggaran $pengajuan): JsonResponse
    {
        $approvals = $pengajuan->approvals()
            ->with('approver')
            ->orderBy('stage_order')
            ->get();

        return response()->json([
            'data' => $approvals,
        ]);
    }

    /**
     * Update the specified pengajuan.
     */
    public function update(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('update', $pengajuan);

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if (! in_array($status, ['draft', 'revision-required'])) {
            return response()->json([
                'message' => 'Pengajuan yang sudah diproses tidak dapat diubah.',
            ], 403);
        }

        $validated = $request->validate([
            'nama_pengajuan' => ['sometimes', 'required', 'string', 'max:255'],
            'tahun' => ['sometimes', 'required', 'string', 'max:9'],
            'tempat' => ['nullable', 'string', 'max:255'],
            'waktu_kegiatan' => ['nullable', 'string', 'max:255'],
            'no_surat' => ['nullable', 'string', 'max:100'],
            'details' => ['sometimes', 'array', 'min:1'],
            'details.*.detail_mata_anggaran_id' => ['nullable', 'integer'],
            'details.*.mata_anggaran_id' => ['nullable', 'integer'],
            'details.*.sub_mata_anggaran_id' => ['nullable', 'integer'],
            'details.*.uraian' => ['nullable', 'string', 'max:500'],
            'details.*.volume' => ['nullable', 'numeric', 'min:0'],
            'details.*.satuan' => ['nullable', 'string', 'max:50'],
            'details.*.harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'details.*.jumlah' => ['required_with:details', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $pengajuan) {
            $details = $validated['details'] ?? null;
            unset($validated['details']);

            $pengajuan->update($validated);

            if ($details !== null) {
                $pengajuan->detailPengajuans()->delete();
                $totalJumlah = 0;

                foreach ($details as $detail) {
                    $detail['pengajuan_anggaran_id'] = $pengajuan->id;
                    DetailPengajuan::create($detail);
                    $totalJumlah += (float) $detail['jumlah'];
                }

                $pengajuan->update(['jumlah_pengajuan_total' => $totalJumlah]);
            }
        });

        $pengajuan->load(['user', 'detailPengajuans', 'approvals']);

        return response()->json([
            'message' => 'Pengajuan berhasil diperbarui.',
            'data' => new PengajuanResource($pengajuan),
        ]);
    }

    /**
     * Resubmit a revised pengajuan for approval.
     */
    public function resubmit(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('submit', $pengajuan);

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if ($status !== 'revision-required') {
            return response()->json([
                'message' => 'Hanya pengajuan berstatus revisi yang dapat diajukan kembali.',
            ], 422);
        }

        try {
            $this->approvalService->resubmit($pengajuan);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $pengajuan->refresh();
        $pengajuan->load(['user', 'detailPengajuans', 'approvals']);

        return response()->json([
            'message' => 'Pengajuan berhasil diajukan kembali.',
            'data' => new PengajuanResource($pengajuan),
        ]);
    }

    /**
     * Remove the specified pengajuan.
     */
    public function destroy(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('delete', $pengajuan);

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if ($status !== 'draft') {
            return response()->json([
                'message' => 'Hanya pengajuan berstatus draft yang dapat dihapus.',
            ], 403);
        }

        $pengajuan->delete();

        return response()->json(null, 204);
    }

    /**
     * Upload an attachment for the pengajuan.
     */
    public function uploadAttachment(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        $this->authorize('update', $pengajuan);

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if (! in_array($status, ['draft', 'revision-required'])) {
            return response()->json([
                'message' => 'Tidak dapat menambah lampiran pada pengajuan yang sudah diproses.',
            ], 422);
        }

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240', // max 10MB
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip,rar',
            ],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $file = $validated['file'];

        // Store file in storage/app/public/pengajuan/{id}/
        $path = $file->store("pengajuan/{$pengajuan->id}", 'public');

        $attachment = Attachment::create([
            'attachable_type' => PengajuanAnggaran::class,
            'attachable_id' => $pengajuan->id,
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
     * Delete an attachment from the pengajuan.
     * Also removes the file from storage.
     */
    public function deleteAttachment(Request $request, PengajuanAnggaran $pengajuan, Attachment $attachment): JsonResponse
    {
        $this->authorize('update', $pengajuan);

        // Verify attachment belongs to this pengajuan
        if ($attachment->attachable_type !== PengajuanAnggaran::class || $attachment->attachable_id !== $pengajuan->id) {
            return response()->json([
                'message' => 'Attachment tidak ditemukan untuk pengajuan ini.',
            ], 404);
        }

        $status = $pengajuan->status_proses instanceof \App\Enums\ProposalStatus
            ? $pengajuan->status_proses->value
            : $pengajuan->status_proses;

        if (! in_array($status, ['draft', 'revision-required'])) {
            return response()->json([
                'message' => 'Tidak dapat menghapus lampiran pada pengajuan yang sudah diproses.',
            ], 422);
        }

        // Delete the file from storage
        if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete the attachment record
        $attachment->delete();

        return response()->json([
            'message' => 'File berhasil dihapus.',
        ]);
    }
}
