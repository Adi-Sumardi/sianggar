<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApprovalResource;
use App\Http\Resources\LpjResource;
use App\Models\Lpj;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LpjApprovalController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * Approve the current stage of an LPJ.
     */
    public function approve(Request $request, Lpj $lpj): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->approve(
                $lpj,
                $user,
                $request->input('notes'),
            );

            $lpj->refresh();
            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            return response()->json([
                'message' => 'LPJ berhasil disetujui.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'lpj' => new LpjResource($lpj),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Validate the LPJ (financial validation step).
     */
    public function validateLpj(Request $request, Lpj $lpj): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->approve(
                $lpj,
                $user,
                $request->input('notes'),
            );

            $lpj->refresh();
            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            return response()->json([
                'message' => 'LPJ berhasil divalidasi.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'lpj' => new LpjResource($lpj),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Request revision for an LPJ.
     */
    public function revise(Request $request, Lpj $lpj): JsonResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $approval = $this->approvalService->revise(
                $lpj,
                $user,
                $request->input('notes'),
            );

            $lpj->refresh();
            $lpj->load(['pengajuanAnggaran', 'approvals.approver']);

            return response()->json([
                'message' => 'LPJ dikembalikan untuk revisi.',
                'data' => [
                    'approval' => new ApprovalResource($approval),
                    'lpj' => new LpjResource($lpj),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }
}
