<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proposal\ApproveRequest;
use App\Http\Requests\Proposal\EditAmountRequest;
use App\Http\Requests\Proposal\FinanceValidateRequest;
use App\Http\Requests\Proposal\MarkAsPaidRequest;
use App\Http\Requests\Proposal\RejectRequest;
use App\Http\Requests\Proposal\ReviseRequest;
use App\Http\Resources\ApprovalResource;
use App\Http\Resources\PengajuanResource;
use App\Models\PengajuanAnggaran;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * Get pending approvals for the current user's role.
     * Returns PengajuanAnggaran objects (not Approval objects) for frontend compatibility.
     */
    public function queue(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $pendingApprovals = $this->approvalService->getPendingForRole($user);

        // Extract the PengajuanAnggaran objects from the approvals
        $pengajuanIds = $pendingApprovals->pluck('approvable_id')->unique()->toArray();

        $pengajuans = PengajuanAnggaran::whereIn('id', $pengajuanIds)
            ->with(['user', 'unitRelation', 'detailPengajuans', 'approvals.approver'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => PengajuanResource::collection($pengajuans),
        ]);
    }

    /**
     * Approve the current stage of a pengajuan.
     */
    public function approve(ApproveRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->approve(
                $pengajuan,
                $user,
                $request->validated()['notes'] ?? null,
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'detailPengajuans', 'approvals.approver']);

            return response()->json([
                'message' => 'Pengajuan berhasil disetujui.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Validate and approve by Staf Keuangan (with checklist + routing params).
     */
    public function validateFinance(FinanceValidateRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->approveWithValidation(
                $pengajuan,
                $user,
                $request->validated(),
                $request->validated()['notes'] ?? null,
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'detailPengajuans', 'approvals.approver', 'financeValidation']);

            return response()->json([
                'message' => 'Validasi dan approval berhasil.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Request revision for a pengajuan (send back to creator).
     */
    public function revise(ReviseRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->revise(
                $pengajuan,
                $user,
                $request->validated()['notes'],
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'detailPengajuans', 'approvals.approver']);

            return response()->json([
                'message' => 'Pengajuan dikembalikan untuk revisi.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Reject a pengajuan (workflow ends permanently).
     */
    public function reject(RejectRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->reject(
                $pengajuan,
                $user,
                $request->validated()['notes'],
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'detailPengajuans', 'approvals.approver']);

            return response()->json([
                'message' => 'Pengajuan ditolak.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Edit the proposal amount (Keuangan/Bendahara stages only).
     */
    public function editAmount(EditAmountRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $log = $this->approvalService->editAmount(
                $pengajuan,
                $user,
                (float) $data['new_amount'],
                $data['reason'] ?? null,
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'detailPengajuans', 'approvals.approver', 'amountEditLogs.editor']);

            return response()->json([
                'message' => 'Nominal berhasil diubah.',
                'data' => [
                    'edit_log' => $log,
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Print voucher (Kasir stage).
     * Voucher number is already generated when Bendahara approves.
     */
    public function printVoucher(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->printVoucher($pengajuan, $user);

            $pengajuan->refresh();
            $pengajuan->load(['user', 'approvals.approver', 'detailPengajuans.subMataAnggaran']);

            return response()->json([
                'message' => 'Voucher berhasil dicetak.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Mark pengajuan as paid (Payment stage).
     */
    public function markAsPaid(MarkAsPaidRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $approval = $this->approvalService->markAsPaid(
                $pengajuan,
                $user,
                $data['recipient_name'],
                $data['payment_method'] ?? null,
                $data['notes'] ?? null,
            );

            $pengajuan->refresh();
            $pengajuan->load(['user', 'approvals.approver', 'paidBy']);

            return response()->json([
                'message' => 'Pembayaran berhasil diproses.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'pengajuan' => new PengajuanResource($pengajuan),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Get voucher printing history (pengajuan with printed vouchers).
     */
    public function voucherHistory(): JsonResponse
    {
        $pengajuans = PengajuanAnggaran::whereNotNull('no_voucher')
            ->where('print_status', 'printed')
            ->with(['user', 'unitRelation'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'data' => PengajuanResource::collection($pengajuans),
        ]);
    }

    /**
     * Get payment history (pengajuan that have been paid).
     */
    public function paymentHistory(): JsonResponse
    {
        $pengajuans = PengajuanAnggaran::whereNotNull('paid_at')
            ->with(['user', 'unitRelation', 'paidBy'])
            ->orderByDesc('paid_at')
            ->get();

        return response()->json([
            'data' => PengajuanResource::collection($pengajuans),
        ]);
    }
}
