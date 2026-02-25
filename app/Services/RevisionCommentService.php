<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\LpjStatus;
use App\Enums\PerubahanAnggaranStatus;
use App\Enums\ProposalStatus;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\Rapbs;
use App\Models\RevisionComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class RevisionCommentService
{
    /**
     * Seed the initial revision note as the first comment in a new round.
     */
    public function seedInitialNote(Model $doc, User $approver, string $notes): RevisionComment
    {
        $currentRound = $this->getCurrentRound($doc);
        $nextRound = $currentRound + 1;

        return $doc->revisionComments()->create([
            'user_id' => $approver->id,
            'message' => $notes,
            'revision_round' => $nextRound,
            'is_initial_note' => true,
        ]);
    }

    /**
     * Add a comment to the current revision thread.
     */
    public function addComment(Model $doc, User $user, string $message): RevisionComment
    {
        $currentRound = $this->getCurrentRound($doc);

        // For pre-existing revised documents with no comments yet, auto-start at round 1
        if ($currentRound === 0) {
            if (! $this->isInRevisionStatus($doc)) {
                throw new \RuntimeException('Belum ada thread revisi untuk dokumen ini.');
            }
            $currentRound = 1;
        }

        if ($this->isThreadReadOnly($doc)) {
            throw new \RuntimeException('Thread revisi sudah ditutup.');
        }

        if (! $this->canComment($doc, $user)) {
            throw new \RuntimeException('Anda tidak memiliki akses untuk mengomentari dokumen ini.');
        }

        return $doc->revisionComments()->create([
            'user_id' => $user->id,
            'message' => $message,
            'revision_round' => $currentRound,
            'is_initial_note' => false,
        ]);
    }

    /**
     * Get comments for the current (latest) revision round.
     */
    public function getCurrentThreadComments(Model $doc): Collection
    {
        $currentRound = $this->getCurrentRound($doc);

        if ($currentRound === 0) {
            return new Collection();
        }

        return $doc->revisionComments()
            ->where('revision_round', $currentRound)
            ->with('user')
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Get all comments grouped by revision round.
     *
     * @return Collection<int, Collection<int, RevisionComment>>
     */
    public function getAllRounds(Model $doc): Collection
    {
        return $doc->revisionComments()
            ->with('user')
            ->orderBy('revision_round')
            ->orderBy('created_at')
            ->get()
            ->groupBy('revision_round');
    }

    /**
     * Get the current (latest) revision round number.
     */
    public function getCurrentRound(Model $doc): int
    {
        return (int) $doc->revisionComments()->max('revision_round');
    }

    /**
     * Check if the document is currently in a revision status.
     */
    public function isInRevisionStatus(Model $doc): bool
    {
        return match (true) {
            $doc instanceof PengajuanAnggaran => $doc->status_proses === ProposalStatus::RevisionRequired,
            $doc instanceof Lpj => $doc->proses === LpjStatus::Revised,
            $doc instanceof PerubahanAnggaran => $doc->status === PerubahanAnggaranStatus::RevisionRequired,
            $doc instanceof Rapbs => $doc->status->canEdit() && $doc->revisionComments()->exists(),
            default => false,
        };
    }

    /**
     * Check if a user can add comments to the revision thread.
     */
    public function canComment(Model $doc, User $user): bool
    {
        // Admin can always comment
        if ($user->hasRole('admin')) {
            return true;
        }

        // Document creator can comment
        $creatorId = $this->getCreatorId($doc);
        if ($creatorId !== null && $user->id === $creatorId) {
            return true;
        }

        // Approver who requested the revision can comment
        $currentRound = $this->getCurrentRound($doc);
        if ($currentRound > 0) {
            $initialNote = $doc->revisionComments()
                ->where('revision_round', $currentRound)
                ->where('is_initial_note', true)
                ->first();

            if ($initialNote && $initialNote->user_id === $user->id) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the revision thread is read-only (document has been resubmitted).
     */
    public function isThreadReadOnly(Model $doc): bool
    {
        // If document is currently in revision status, thread is always writable
        if ($this->isInRevisionStatus($doc)) {
            return false;
        }

        // No comments exist and not in revision — nothing to show
        $currentRound = $this->getCurrentRound($doc);
        if ($currentRound === 0) {
            return true;
        }

        // Has comments but no longer in revision — read-only (resubmitted)
        return true;
    }

    /**
     * Get the creator/owner user ID of the document.
     */
    private function getCreatorId(Model $doc): ?int
    {
        return match (true) {
            $doc instanceof PengajuanAnggaran => $doc->user_id,
            $doc instanceof Lpj => $doc->pengajuanAnggaran?->user_id,
            $doc instanceof PerubahanAnggaran => $doc->user_id,
            $doc instanceof Rapbs => $doc->submitted_by,
            default => null,
        };
    }

    /**
     * Resolve a document model from type string and ID.
     */
    public function resolveDocument(string $type, int $id): Model
    {
        $model = match ($type) {
            'pengajuan' => PengajuanAnggaran::class,
            'lpj' => Lpj::class,
            'perubahan-anggaran' => PerubahanAnggaran::class,
            'rapbs' => Rapbs::class,
            default => throw new \InvalidArgumentException("Tipe dokumen tidak valid: {$type}"),
        };

        return $model::findOrFail($id);
    }
}
