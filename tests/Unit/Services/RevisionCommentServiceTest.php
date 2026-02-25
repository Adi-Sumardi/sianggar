<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\PerubahanAnggaranStatus;
use App\Enums\ProposalStatus;
use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\Rapbs;
use App\Models\RevisionComment;
use App\Models\User;
use App\Services\RevisionCommentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->service = new RevisionCommentService();
});

describe('RevisionCommentService', function () {

    // =========================================================================
    // seedInitialNote
    // =========================================================================

    describe('seedInitialNote', function () {
        it('creates initial note with round 1 for new document', function () {
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $comment = $this->service->seedInitialNote($pengajuan, $approver, 'Mohon perbaiki anggaran');

            expect($comment)
                ->toBeInstanceOf(RevisionComment::class)
                ->and($comment->message)->toBe('Mohon perbaiki anggaran')
                ->and($comment->revision_round)->toBe(1)
                ->and($comment->is_initial_note)->toBeTrue()
                ->and($comment->user_id)->toBe($approver->id)
                ->and($comment->commentable_type)->toContain('PengajuanAnggaran')
                ->and($comment->commentable_id)->toBe($pengajuan->id);
        });

        it('increments round for subsequent revisions', function () {
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            // First revision
            $this->service->seedInitialNote($pengajuan, $approver, 'Revisi pertama');

            // Second revision
            $comment2 = $this->service->seedInitialNote($pengajuan, $approver, 'Revisi kedua');

            expect($comment2->revision_round)->toBe(2)
                ->and($comment2->is_initial_note)->toBeTrue();
        });

        it('works with LPJ model', function () {
            $approver = User::factory()->keuangan()->create();
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Revised->value,
            ]);

            $comment = $this->service->seedInitialNote($lpj, $approver, 'Perlu perbaikan LPJ');

            expect($comment->commentable_type)->toContain('Lpj')
                ->and($comment->commentable_id)->toBe($lpj->id)
                ->and($comment->revision_round)->toBe(1);
        });

        it('works with PerubahanAnggaran model', function () {
            $approver = User::factory()->direktur()->create();
            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::RevisionRequired->value,
            ]);

            $comment = $this->service->seedInitialNote($perubahan, $approver, 'Data transfer salah');

            expect($comment->commentable_type)->toContain('PerubahanAnggaran')
                ->and($comment->commentable_id)->toBe($perubahan->id)
                ->and($comment->revision_round)->toBe(1);
        });

        it('works with Rapbs model', function () {
            $approver = User::factory()->direktur()->create();
            $rapbs = Rapbs::factory()->create([
                'status' => RapbsStatus::Draft->value,
            ]);

            $comment = $this->service->seedInitialNote($rapbs, $approver, 'RAPBS perlu diperbaiki');

            expect($comment->commentable_type)->toContain('Rapbs')
                ->and($comment->commentable_id)->toBe($rapbs->id)
                ->and($comment->revision_round)->toBe(1);
        });
    });

    // =========================================================================
    // addComment
    // =========================================================================

    describe('addComment', function () {
        it('adds comment to current thread', function () {
            $approver = User::factory()->direktur()->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            // Seed initial note
            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki anggaran');

            // Creator replies
            $reply = $this->service->addComment($pengajuan, $creator, 'Sudah diperbaiki, mohon dicek');

            expect($reply->revision_round)->toBe(1)
                ->and($reply->is_initial_note)->toBeFalse()
                ->and($reply->user_id)->toBe($creator->id)
                ->and($reply->message)->toBe('Sudah diperbaiki, mohon dicek');
        });

        it('throws error when no thread exists and not in revision', function () {
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::Submitted->value,
            ]);

            expect(fn () => $this->service->addComment($pengajuan, $creator, 'Some message'))
                ->toThrow(\RuntimeException::class, 'Belum ada thread revisi');
        });

        it('auto-starts at round 1 when in revision but no comments exist', function () {
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            // No seedInitialNote — simulates pre-existing revised document
            $reply = $this->service->addComment($pengajuan, $creator, 'Saya sudah perbaiki');

            expect($reply->revision_round)->toBe(1)
                ->and($reply->is_initial_note)->toBeFalse()
                ->and($reply->user_id)->toBe($creator->id);
        });

        it('throws error when thread is read-only', function () {
            $approver = User::factory()->direktur()->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            // Simulate resubmit — status no longer RevisionRequired
            $pengajuan->update(['status_proses' => ProposalStatus::Submitted->value]);

            expect(fn () => $this->service->addComment($pengajuan, $creator, 'Reply'))
                ->toThrow(\RuntimeException::class, 'Thread revisi sudah ditutup');
        });

        it('throws error when user cannot comment', function () {
            $approver = User::factory()->direktur()->create();
            $randomUser = User::factory()->unit('smp')->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            // Random user (not creator, not approver) tries to comment
            expect(fn () => $this->service->addComment($pengajuan, $randomUser, 'Saya siapa?'))
                ->toThrow(\RuntimeException::class, 'tidak memiliki akses');
        });
    });

    // =========================================================================
    // getCurrentThreadComments
    // =========================================================================

    describe('getCurrentThreadComments', function () {
        it('returns comments for current round only', function () {
            $approver = User::factory()->direktur()->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            // Round 1
            $this->service->seedInitialNote($pengajuan, $approver, 'Revisi 1');
            $pengajuan->revisionComments()->create([
                'user_id' => $creator->id,
                'message' => 'Reply round 1',
                'revision_round' => 1,
                'is_initial_note' => false,
            ]);

            // Round 2
            $this->service->seedInitialNote($pengajuan, $approver, 'Revisi 2');

            $comments = $this->service->getCurrentThreadComments($pengajuan);

            // Should only return round 2 (1 comment — the initial note)
            expect($comments)->toHaveCount(1)
                ->and($comments->first()->message)->toBe('Revisi 2')
                ->and($comments->first()->revision_round)->toBe(2);
        });

        it('returns empty collection when no comments exist', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            $comments = $this->service->getCurrentThreadComments($pengajuan);

            expect($comments)->toHaveCount(0);
        });
    });

    // =========================================================================
    // getAllRounds
    // =========================================================================

    describe('getAllRounds', function () {
        it('returns all rounds grouped by round number', function () {
            $approver = User::factory()->direktur()->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            // Round 1: 2 comments
            $this->service->seedInitialNote($pengajuan, $approver, 'Revisi 1');
            $pengajuan->revisionComments()->create([
                'user_id' => $creator->id,
                'message' => 'Reply round 1',
                'revision_round' => 1,
                'is_initial_note' => false,
            ]);

            // Round 2: 1 comment
            $this->service->seedInitialNote($pengajuan, $approver, 'Revisi 2');

            $rounds = $this->service->getAllRounds($pengajuan);

            expect($rounds)->toHaveCount(2)
                ->and($rounds[1])->toHaveCount(2)
                ->and($rounds[2])->toHaveCount(1);
        });
    });

    // =========================================================================
    // isInRevisionStatus
    // =========================================================================

    describe('isInRevisionStatus', function () {
        it('returns true for PengajuanAnggaran with RevisionRequired', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            expect($this->service->isInRevisionStatus($pengajuan))->toBeTrue();
        });

        it('returns false for PengajuanAnggaran with Submitted', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::Submitted->value,
            ]);

            expect($this->service->isInRevisionStatus($pengajuan))->toBeFalse();
        });

        it('returns true for Lpj with Revised', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Revised->value,
            ]);

            expect($this->service->isInRevisionStatus($lpj))->toBeTrue();
        });

        it('returns false for Lpj with Submitted', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Submitted->value,
            ]);

            expect($this->service->isInRevisionStatus($lpj))->toBeFalse();
        });

        it('returns true for PerubahanAnggaran with RevisionRequired', function () {
            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::RevisionRequired->value,
            ]);

            expect($this->service->isInRevisionStatus($perubahan))->toBeTrue();
        });

        it('returns false for PerubahanAnggaran with Submitted', function () {
            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
            ]);

            expect($this->service->isInRevisionStatus($perubahan))->toBeFalse();
        });

        it('returns true for Rapbs in Draft with revision comments', function () {
            $approver = User::factory()->direktur()->create();
            $rapbs = Rapbs::factory()->create([
                'status' => RapbsStatus::Draft->value,
            ]);

            // Add a revision comment to indicate it was revised
            $this->service->seedInitialNote($rapbs, $approver, 'Perbaiki RAPBS');

            expect($this->service->isInRevisionStatus($rapbs))->toBeTrue();
        });

        it('returns false for Rapbs in Draft without revision comments', function () {
            $rapbs = Rapbs::factory()->create([
                'status' => RapbsStatus::Draft->value,
            ]);

            expect($this->service->isInRevisionStatus($rapbs))->toBeFalse();
        });
    });

    // =========================================================================
    // canComment
    // =========================================================================

    describe('canComment', function () {
        it('allows admin to comment', function () {
            $admin = User::factory()->admin()->create();
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            expect($this->service->canComment($pengajuan, $admin))->toBeTrue();
        });

        it('allows document creator to comment', function () {
            $creator = User::factory()->unit('sd')->create();
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            expect($this->service->canComment($pengajuan, $creator))->toBeTrue();
        });

        it('allows approver who requested revision to comment', function () {
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            expect($this->service->canComment($pengajuan, $approver))->toBeTrue();
        });

        it('denies random user from commenting', function () {
            $randomUser = User::factory()->unit('smp')->create();
            $approver = User::factory()->direktur()->create();
            $creator = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            expect($this->service->canComment($pengajuan, $randomUser))->toBeFalse();
        });

        it('allows RAPBS submitter to comment', function () {
            $submitter = User::factory()->unit('sd')->create();
            $approver = User::factory()->direktur()->create();
            $rapbs = Rapbs::factory()->create([
                'status' => RapbsStatus::Draft->value,
                'submitted_by' => $submitter->id,
            ]);

            $this->service->seedInitialNote($rapbs, $approver, 'Perbaiki RAPBS');

            expect($this->service->canComment($rapbs, $submitter))->toBeTrue();
        });
    });

    // =========================================================================
    // isThreadReadOnly
    // =========================================================================

    describe('isThreadReadOnly', function () {
        it('returns true when no thread exists and not in revision', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::Submitted->value,
            ]);

            expect($this->service->isThreadReadOnly($pengajuan))->toBeTrue();
        });

        it('returns false when in revision even without comments', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            expect($this->service->isThreadReadOnly($pengajuan))->toBeFalse();
        });

        it('returns false when document is in revision status', function () {
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            expect($this->service->isThreadReadOnly($pengajuan))->toBeFalse();
        });

        it('returns true when document has been resubmitted', function () {
            $approver = User::factory()->direktur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::RevisionRequired->value,
            ]);

            $this->service->seedInitialNote($pengajuan, $approver, 'Perbaiki');

            // Simulate resubmit
            $pengajuan->update(['status_proses' => ProposalStatus::Submitted->value]);

            expect($this->service->isThreadReadOnly($pengajuan))->toBeTrue();
        });
    });

    // =========================================================================
    // resolveDocument
    // =========================================================================

    describe('resolveDocument', function () {
        it('resolves pengajuan type', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            $doc = $this->service->resolveDocument('pengajuan', $pengajuan->id);

            expect($doc)->toBeInstanceOf(PengajuanAnggaran::class)
                ->and($doc->id)->toBe($pengajuan->id);
        });

        it('resolves lpj type', function () {
            $lpj = Lpj::factory()->create();

            $doc = $this->service->resolveDocument('lpj', $lpj->id);

            expect($doc)->toBeInstanceOf(Lpj::class)
                ->and($doc->id)->toBe($lpj->id);
        });

        it('resolves perubahan-anggaran type', function () {
            $perubahan = PerubahanAnggaran::factory()->create();

            $doc = $this->service->resolveDocument('perubahan-anggaran', $perubahan->id);

            expect($doc)->toBeInstanceOf(PerubahanAnggaran::class)
                ->and($doc->id)->toBe($perubahan->id);
        });

        it('resolves rapbs type', function () {
            $rapbs = Rapbs::factory()->create();

            $doc = $this->service->resolveDocument('rapbs', $rapbs->id);

            expect($doc)->toBeInstanceOf(Rapbs::class)
                ->and($doc->id)->toBe($rapbs->id);
        });

        it('throws exception for invalid type', function () {
            expect(fn () => $this->service->resolveDocument('invalid', 1))
                ->toThrow(\InvalidArgumentException::class, 'Tipe dokumen tidak valid');
        });

        it('throws exception for non-existent document', function () {
            expect(fn () => $this->service->resolveDocument('pengajuan', 99999))
                ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        });
    });

    // =========================================================================
    // Integration: seedInitialNote in revise() methods
    // =========================================================================

    describe('integration with revise()', function () {
        it('creates revision comment when PengajuanAnggaran is revised', function () {
            $creator = User::factory()->unit('sd')->create();
            $approver = User::factory()->staffDirektur()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $creator->id,
                'status_proses' => ProposalStatus::Submitted->value,
                'current_approval_stage' => ApprovalStage::StaffDirektur->value,
            ]);

            // Create the approval record
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $approvalService = new \App\Services\ApprovalService();
            $approvalService->revise($pengajuan, $approver, 'Dokumen kurang lengkap');

            // Check revision comment was created
            $comments = $pengajuan->revisionComments()->get();
            expect($comments)->toHaveCount(1)
                ->and($comments->first()->message)->toBe('Dokumen kurang lengkap')
                ->and($comments->first()->is_initial_note)->toBeTrue()
                ->and($comments->first()->revision_round)->toBe(1)
                ->and($comments->first()->user_id)->toBe($approver->id);
        });
    });
});
