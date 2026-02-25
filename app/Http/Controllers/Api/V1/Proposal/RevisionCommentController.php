<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Proposal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proposal\StoreRevisionCommentRequest;
use App\Services\RevisionCommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RevisionCommentController extends Controller
{
    public function __construct(
        private readonly RevisionCommentService $revisionCommentService,
    ) {}

    /**
     * Get revision comments for a document.
     */
    public function index(Request $request, string $type, int $id): JsonResponse
    {
        try {
            $doc = $this->revisionCommentService->resolveDocument($type, $id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();

        $round = $request->query('round');

        if ($round === 'all') {
            $rounds = $this->revisionCommentService->getAllRounds($doc);

            return response()->json([
                'data' => [
                    'rounds' => $rounds,
                    'current_round' => $this->revisionCommentService->getCurrentRound($doc),
                    'is_read_only' => $this->revisionCommentService->isThreadReadOnly($doc),
                    'is_in_revision' => $this->revisionCommentService->isInRevisionStatus($doc),
                    'can_comment' => $this->revisionCommentService->canComment($doc, $user),
                ],
            ]);
        }

        $comments = $this->revisionCommentService->getCurrentThreadComments($doc);

        return response()->json([
            'data' => [
                'comments' => $comments,
                'current_round' => $this->revisionCommentService->getCurrentRound($doc),
                'is_read_only' => $this->revisionCommentService->isThreadReadOnly($doc),
                'is_in_revision' => $this->revisionCommentService->isInRevisionStatus($doc),
                'can_comment' => $this->revisionCommentService->canComment($doc, $user),
            ],
        ]);
    }

    /**
     * Add a comment to the revision thread.
     */
    public function store(StoreRevisionCommentRequest $request, string $type, int $id): JsonResponse
    {
        try {
            $doc = $this->revisionCommentService->resolveDocument($type, $id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $comment = $this->revisionCommentService->addComment(
                $doc,
                $user,
                $request->validated()['message'],
            );

            return response()->json([
                'message' => 'Komentar berhasil ditambahkan.',
                'data' => $comment->load('user'),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
