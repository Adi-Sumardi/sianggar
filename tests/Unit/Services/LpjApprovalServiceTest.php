<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();

    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (\App\Enums\UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->service = new LpjApprovalService();
});

describe('LpjApprovalService', function () {
    describe('submit', function () {
        it('submits LPJ to StaffKeuangan stage', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);
            $submitter = User::factory()->unit()->create();

            $this->service->submit($lpj, $submitter);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);

            // Check approval was created
            expect($lpj->approvals)->toHaveCount(1);
            $approval = $lpj->approvals->first();
            expect($approval->stage)->toBe(ApprovalStage::StaffKeuangan)
                ->and($approval->status)->toBe(ApprovalStatus::Pending);
        });
    });

    describe('validate', function () {
        it('validates LPJ with checklist at StaffKeuangan stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
                'notes' => 'All documents verified',
            ];

            $validation = $this->service->validate($lpj, $staffKeuangan, $validationData);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Validated)
                ->and($lpj->reference_type)->toBe(ReferenceType::Education)
                ->and($lpj->validated_by)->toBe($staffKeuangan->id)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur);

            expect($validation->has_activity_identity)->toBeTrue()
                ->and($validation->reference_type)->toBe(ReferenceType::Education);
        });

        it('throws exception when checklist is incomplete', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => false, // Missing
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $staffKeuangan, $validationData))
                ->toThrow(RuntimeException::class, 'Semua item checklist harus dicentang');
        });

        it('throws exception when not at StaffKeuangan stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $staffKeuangan, $validationData))
                ->toThrow(RuntimeException::class, 'Validasi hanya dapat dilakukan pada tahap Staf Keuangan');
        });

        it('throws exception when validator has wrong role', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $wrongUser = User::factory()->kasir()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $wrongUser, $validationData))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang untuk validasi LPJ');
        });
    });

    describe('approve', function () {
        it('approves at Direktur stage and moves to Keuangan', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->approve($lpj, $direktur, 'Approved');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($lpj->proses)->toBe(LpjStatus::ApprovedByMiddle)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);
        });

        it('approves at Keuangan stage (final approval)', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Keuangan);
            $lpj->update(['proses' => LpjStatus::ApprovedByMiddle->value]);
            $keuangan = User::factory()->keuangan()->create();

            $approval = $this->service->approve($lpj, $keuangan, 'Final approval');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->current_approval_stage)->toBeNull();
        });

        it('throws exception when approver has wrong role', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $wrongUser = User::factory()->kasir()->create();

            expect(fn () => $this->service->approve($lpj, $wrongUser))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang');
        });

        it('allows admin to approve any stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $admin = User::factory()->admin()->create();

            $approval = $this->service->approve($lpj, $admin);

            expect($approval->status)->toBe(ApprovalStatus::Approved);
        });
    });

    describe('revise', function () {
        it('requests revision and saves revision stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->revise($lpj, $direktur, 'Please add more details');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->toBe('Please add more details')
                ->and($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->revision_requested_stage)->toBe(LpjApprovalStage::Direktur->value)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('resubmit', function () {
        it('resubmits to the stage that requested revision', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $this->service->revise($lpj, $direktur, 'Fix this');

            $lpj->refresh();
            $this->service->resubmit($lpj);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur)
                ->and($lpj->revision_requested_stage)->toBeNull();
        });

        it('resubmits from start when no revision stage recorded', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Revised->value,
                'revision_requested_stage' => null,
            ]);

            $this->service->resubmit($lpj);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);
        });
    });

    describe('reject', function () {
        it('rejects LPJ permanently', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->reject($lpj, $direktur, 'Insufficient documentation');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($lpj->proses)->toBe(LpjStatus::Rejected)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('getNextStage routing', function () {
        it('routes StaffKeuangan to Direktur for Education reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Education->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::Direktur);
        });

        it('routes StaffKeuangan to KabagSdmUmum for HrGeneral reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::HrGeneral->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::KabagSdmUmum);
        });

        it('routes StaffKeuangan to KabagSekretariat for Secretariat reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Secretariat->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::KabagSekretariat);
        });

        it('routes all middle approvers to Keuangan', function () {
            $lpj = Lpj::factory()->create();

            expect($this->service->getNextStage($lpj, LpjApprovalStage::Direktur))->toBe(LpjApprovalStage::Keuangan);
            expect($this->service->getNextStage($lpj, LpjApprovalStage::KabagSdmUmum))->toBe(LpjApprovalStage::Keuangan);
            expect($this->service->getNextStage($lpj, LpjApprovalStage::KabagSekretariat))->toBe(LpjApprovalStage::Keuangan);
        });

        it('returns null after Keuangan (end of workflow)', function () {
            $lpj = Lpj::factory()->create();
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::Keuangan);

            expect($next)->toBeNull();
        });

        it('throws exception when reference_type is not set', function () {
            $lpj = Lpj::factory()->create(['reference_type' => null]);

            expect(fn () => $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan))
                ->toThrow(RuntimeException::class, 'Rujukan LPJ belum ditentukan');
        });
    });

    describe('getExpectedStages', function () {
        it('returns correct stages for Education reference', function () {
            $lpj = Lpj::factory()->validated()->create();
            $stages = $this->service->getExpectedStages($lpj);

            expect($stages)->toHaveCount(3);
            expect($stages[0]['stage'])->toBe(LpjApprovalStage::StaffKeuangan->value);
            expect($stages[1]['stage'])->toBe(LpjApprovalStage::Direktur->value);
            expect($stages[2]['stage'])->toBe(LpjApprovalStage::Keuangan->value);
        });

        it('returns correct stages for HrGeneral reference', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Validated->value,
                'current_approval_stage' => LpjApprovalStage::KabagSdmUmum->value,
                'reference_type' => ReferenceType::HrGeneral->value,
                'validated_at' => now(),
            ]);

            $stages = $this->service->getExpectedStages($lpj);

            expect($stages[1]['stage'])->toBe(LpjApprovalStage::KabagSdmUmum->value);
        });
    });

    describe('getPendingForRole', function () {
        it('returns pending LPJ approvals for user role', function () {
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            // Create 3 LPJs at StaffKeuangan stage
            for ($i = 0; $i < 3; $i++) {
                createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            }

            $pending = $this->service->getPendingForRole($staffKeuangan);

            expect($pending)->toHaveCount(3);
        });

        it('returns empty collection for role with no pending LPJs', function () {
            $keuangan = User::factory()->keuangan()->create();

            $pending = $this->service->getPendingForRole($keuangan);

            expect($pending)->toHaveCount(0);
        });
    });

    describe('getCurrentStageApproval', function () {
        it('returns current pending approval', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);

            $approval = $this->service->getCurrentStageApproval($lpj);

            expect($approval)->not->toBeNull()
                ->and($approval->stage)->toBe(ApprovalStage::StaffKeuangan)
                ->and($approval->status)->toBe(ApprovalStatus::Pending);
        });

        it('returns null when no pending approval', function () {
            $lpj = Lpj::factory()->approved()->create();

            $approval = $this->service->getCurrentStageApproval($lpj);

            expect($approval)->toBeNull();
        });
    });

    describe('getApprovalTimeline', function () {
        it('returns all approvals in order', function () {
            $lpj = Lpj::factory()->create();

            Approval::factory()->approved()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::StaffKeuangan->value,
                'stage_order' => 1,
            ]);

            Approval::factory()->approved()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
                'stage_order' => 2,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $timeline = $this->service->getApprovalTimeline($lpj);

            expect($timeline)->toHaveCount(3)
                ->and($timeline[0]->stage_order)->toBe(1)
                ->and($timeline[1]->stage_order)->toBe(2)
                ->and($timeline[2]->stage_order)->toBe(3);
        });
    });

});

// Helper function to create LPJ at specific stage
function createLpjAtStage(LpjApprovalStage $stage): Lpj
{
    $pengajuan = PengajuanAnggaran::factory()->create();

    $status = match ($stage) {
        LpjApprovalStage::StaffKeuangan => LpjStatus::Submitted,
        LpjApprovalStage::Direktur, LpjApprovalStage::KabagSdmUmum, LpjApprovalStage::KabagSekretariat => LpjStatus::Validated,
        LpjApprovalStage::Keuangan => LpjStatus::ApprovedByMiddle,
    };

    $lpj = Lpj::factory()->create([
        'pengajuan_anggaran_id' => $pengajuan->id,
        'proses' => $status->value,
        'current_approval_stage' => $stage->value,
        'reference_type' => ReferenceType::Education->value,
    ]);

    Approval::factory()->pending()->create([
        'approvable_type' => Lpj::class,
        'approvable_id' => $lpj->id,
        'stage' => $stage->value,
    ]);

    return $lpj;
}
