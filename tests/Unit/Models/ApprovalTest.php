<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Approval Model', function () {
    describe('factory', function () {
        it('creates an approval with default attributes', function () {
            $approval = Approval::factory()->create();

            expect($approval)->toBeInstanceOf(Approval::class)
                ->and($approval->stage)->toBe(ApprovalStage::StaffDirektur)
                ->and($approval->status)->toBe(ApprovalStatus::Pending)
                ->and($approval->stage_order)->toBe(1);
        });

        it('creates pending approval', function () {
            $approval = Approval::factory()->pending()->create();
            expect($approval->status)->toBe(ApprovalStatus::Pending);
        });

        it('creates approved approval', function () {
            $approval = Approval::factory()->approved()->create();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($approval->approved_by)->not->toBeNull()
                ->and($approval->approved_at)->not->toBeNull();
        });

        it('creates revised approval', function () {
            $approval = Approval::factory()->revised()->create();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->not->toBeNull();
        });

        it('creates rejected approval', function () {
            $approval = Approval::factory()->rejected()->create();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($approval->notes)->not->toBeNull();
        });

        it('creates approval for specific stage', function () {
            $approval = Approval::factory()->direktur()->create();
            expect($approval->stage)->toBe(ApprovalStage::Direktur);

            $approval = Approval::factory()->keuangan()->create();
            expect($approval->stage)->toBe(ApprovalStage::Keuangan);

            $approval = Approval::factory()->bendahara()->create();
            expect($approval->stage)->toBe(ApprovalStage::Bendahara);
        });
    });

    describe('polymorphic relationships', function () {
        it('can belong to PengajuanAnggaran', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $approval = Approval::factory()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
            ]);

            expect($approval->approvable)->toBeInstanceOf(PengajuanAnggaran::class)
                ->and($approval->approvable->id)->toBe($pengajuan->id);
        });

        it('can belong to Lpj', function () {
            $lpj = Lpj::factory()->create();
            $approval = Approval::factory()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
            ]);

            expect($approval->approvable)->toBeInstanceOf(Lpj::class)
                ->and($approval->approvable->id)->toBe($lpj->id);
        });
    });

    describe('approver relationship', function () {
        it('belongs to an approver user', function () {
            $user = User::factory()->create();
            $approval = Approval::factory()->create([
                'approved_by' => $user->id,
            ]);

            expect($approval->approver)->toBeInstanceOf(User::class)
                ->and($approval->approver->id)->toBe($user->id);
        });

        it('returns null when no approver', function () {
            $approval = Approval::factory()->pending()->create([
                'approved_by' => null,
            ]);

            expect($approval->approver)->toBeNull();
        });
    });

    describe('stage ordering', function () {
        it('maintains stage order', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            $approval1 = Approval::factory()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
            ]);

            $approval2 = Approval::factory()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffKeuangan->value,
                'stage_order' => 2,
            ]);

            $approval3 = Approval::factory()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 3,
            ]);

            $approvals = $pengajuan->approvals()->orderBy('stage_order')->get();

            expect($approvals[0]->stage_order)->toBe(1)
                ->and($approvals[1]->stage_order)->toBe(2)
                ->and($approvals[2]->stage_order)->toBe(3);
        });
    });

    describe('status transitions', function () {
        it('can transition from pending to approved', function () {
            $user = User::factory()->create();
            $approval = Approval::factory()->pending()->create();

            $approval->update([
                'status' => ApprovalStatus::Approved->value,
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            $approval->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($approval->approved_by)->toBe($user->id);
        });

        it('can transition from pending to revised', function () {
            $user = User::factory()->create();
            $approval = Approval::factory()->pending()->create();

            $approval->update([
                'status' => ApprovalStatus::Revised->value,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'notes' => 'Please revise the budget calculation',
            ]);

            $approval->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->toBe('Please revise the budget calculation');
        });

        it('can transition from pending to rejected', function () {
            $user = User::factory()->create();
            $approval = Approval::factory()->pending()->create();

            $approval->update([
                'status' => ApprovalStatus::Rejected->value,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'notes' => 'Budget exceeds allocation',
            ]);

            $approval->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($approval->notes)->toBe('Budget exceeds allocation');
        });
    });

    describe('filtering by status', function () {
        beforeEach(function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            Approval::factory()->pending()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
            ]);
            Approval::factory()->approved()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
            ]);
            Approval::factory()->revised()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
            ]);
        });

        it('can filter pending approvals', function () {
            $pending = Approval::where('status', ApprovalStatus::Pending->value)->get();
            expect($pending)->toHaveCount(1);
        });

        it('can filter approved approvals', function () {
            $approved = Approval::where('status', ApprovalStatus::Approved->value)->get();
            expect($approved)->toHaveCount(1);
        });

        it('can filter revised approvals', function () {
            $revised = Approval::where('status', ApprovalStatus::Revised->value)->get();
            expect($revised)->toHaveCount(1);
        });
    });
});
