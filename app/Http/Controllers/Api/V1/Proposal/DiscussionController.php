<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proposal\StoreDiscussionMessageRequest;
use App\Models\Discussion;
use App\Models\DiscussionMessage;
use App\Models\PengajuanAnggaran;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * Get all active discussions with pengajuan info.
     * Used for global floating button.
     * Limited to 50 most recent to prevent performance issues.
     */
    public function active(Request $request): JsonResponse
    {
        $limit = min((int) $request->query('limit', '50'), 100);

        $discussions = Discussion::where('status', 'open')
            ->with([
                'opener',
                'messages.user',
                'pengajuanAnggaran.unitRelation',
                'pengajuanAnggaran.user',
            ])
            ->orderByDesc('opened_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $discussions,
        ]);
    }

    public function open(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $discussion = $this->approvalService->openDiscussion($pengajuan, $user);

            return response()->json([
                'message' => 'Diskusi berhasil dibuka.',
                'data' => $discussion->load(['opener']),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function close(Request $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $discussion = $this->approvalService->closeDiscussion($pengajuan, $user);

            return response()->json([
                'message' => 'Diskusi berhasil ditutup.',
                'data' => $discussion->load(['opener', 'closer']),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function messages(PengajuanAnggaran $pengajuan): JsonResponse
    {
        $discussions = $pengajuan->discussions()
            ->with(['opener', 'closer', 'messages.user'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $discussions,
        ]);
    }

    public function addMessage(StoreDiscussionMessageRequest $request, PengajuanAnggaran $pengajuan): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $discussion = $pengajuan->activeDiscussion;

        if (! $discussion) {
            return response()->json([
                'message' => 'Tidak ada diskusi yang aktif.',
            ], 422);
        }

        $message = DiscussionMessage::create([
            'discussion_id' => $discussion->id,
            'user_id' => $user->id,
            'message' => $request->validated()['message'],
        ]);

        return response()->json([
            'message' => 'Pesan berhasil ditambahkan.',
            'data' => $message->load('user'),
        ], 201);
    }
}
