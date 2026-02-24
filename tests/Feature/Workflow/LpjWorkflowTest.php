<?php

declare(strict_types=1);

use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->lpjService = new LpjApprovalService();
});

describe('Complete LPJ Workflow', function () {
    describe('Education Reference Flow', function () {
        it('follows correct approval chain for Education LPJ', function () {
            // Setup users
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();
            $keuangan = User::factory()->keuangan()->create();

            // Create LPJ
            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            // Step 1: Submit (→ StaffKeuangan)
            $this->lpjService->submit($lpj, $unitUser);
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);

            // Step 2: StaffKeuangan validates (→ Direktur)
            $this->lpjService->validate($lpj, $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
                'notes' => 'Complete',
            ]);
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Validated)
                ->and($lpj->reference_type)->toBe(ReferenceType::Education)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur);

            // Step 3: Direktur approves (→ Keuangan)
            $this->lpjService->approve($lpj, $direktur, 'Approved');
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::ApprovedByMiddle)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);

            // Step 4: Keuangan approves (→ Complete)
            $this->lpjService->approve($lpj, $keuangan, 'Final approval');
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->current_approval_stage)->toBeNull();

            // Verify total approvals: 3 stages
            expect($lpj->approvals)->toHaveCount(3);
            $lpj->approvals->each(fn ($approval) => expect($approval->status)->toBe(ApprovalStatus::Approved));
        });
    });

    describe('HrGeneral Reference Flow', function () {
        it('routes to KabagSdmUmum for HrGeneral reference', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $kabagSdmUmum = User::factory()->kabagSdmUmum()->create();
            $keuangan = User::factory()->keuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            // Submit
            $this->lpjService->submit($lpj, $unitUser);

            // Validate with HrGeneral reference
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::HrGeneral->value,
            ]);

            $lpj->refresh();
            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::KabagSdmUmum);

            // KabagSdmUmum approves → Keuangan
            $this->lpjService->approve($lpj, $kabagSdmUmum);
            $lpj->refresh();

            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);

            // Keuangan approves → Complete
            $this->lpjService->approve($lpj, $keuangan);
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Approved);
        });
    });

    describe('Secretariat Reference Flow', function () {
        it('routes to KabagSekretariat for Secretariat reference', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $sekretariat = User::factory()->sekretariat()->create();
            $keuangan = User::factory()->keuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);

            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Secretariat->value,
            ]);

            $lpj->refresh();
            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::KabagSekretariat);

            // KabagSekretariat approves → Keuangan
            $this->lpjService->approve($lpj, $sekretariat);
            $lpj->refresh();

            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);

            // Keuangan approves → Complete
            $this->lpjService->approve($lpj, $keuangan);
            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Approved);
        });
    });

    describe('LPJ Revision Flow', function () {
        it('returns to revision stage after resubmit', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            // Submit and validate
            $this->lpjService->submit($lpj, $unitUser);
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]);

            // Direktur requests revision
            $this->lpjService->revise($lpj->fresh(), $direktur, 'Add more details');

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->revision_requested_stage)->toBe(LpjApprovalStage::Direktur->value)
                ->and($lpj->current_approval_stage)->toBeNull();

            // User resubmits → returns to Direktur (not StaffKeuangan)
            $this->lpjService->resubmit($lpj);

            $lpj->refresh();
            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur)
                ->and($lpj->revision_requested_stage)->toBeNull();
        });

        it('resubmits from start when no revision stage recorded', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'proses' => LpjStatus::Revised->value,
                'revision_requested_stage' => null,
            ]);

            $this->lpjService->resubmit($lpj);

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);
        });
    });

    describe('LPJ Rejection Flow', function () {
        it('ends workflow permanently when rejected', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]);

            // Direktur rejects
            $this->lpjService->reject($lpj->fresh(), $direktur, 'Insufficient documentation');

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Rejected)
                ->and($lpj->current_approval_stage)->toBeNull();

            // Verify rejection is recorded - use latest('id') to get the most recently created
            $lastApproval = $lpj->approvals()->latest('id')->first();
            expect($lastApproval->status)->toBe(ApprovalStatus::Rejected);
        });
    });

    describe('Validation Checklist', function () {
        it('requires all checklist items to be true', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);

            // Missing has_cover_letter
            expect(fn () => $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => false,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]))->toThrow(RuntimeException::class, 'Semua item checklist harus dicentang');
        });

        it('stores validation notes', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);

            $validation = $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
                'notes' => 'All documents verified and complete',
            ]);

            expect($validation->notes)->toBe('All documents verified and complete');

            $lpj->refresh();
            expect($lpj->validation_notes)->toBe('All documents verified and complete');
        });
    });

    describe('Authorization Checks', function () {
        it('prevents unauthorized users from validating', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $wrongUser = User::factory()->kasir()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);

            expect(fn () => $this->lpjService->validate($lpj->fresh(), $wrongUser, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]))->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang untuk validasi LPJ');
        });

        it('prevents unauthorized users from approving', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $wrongUser = User::factory()->kasir()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]);

            // Now at Direktur stage, but Kasir tries to approve
            expect(fn () => $this->lpjService->approve($lpj->fresh(), $wrongUser))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang');
        });

        it('allows admin to approve any stage', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $admin = User::factory()->admin()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]);

            // Admin approves at Direktur stage
            $approval = $this->lpjService->approve($lpj->fresh(), $admin);

            expect($approval->status)->toBe(ApprovalStatus::Approved);
        });
    });

    describe('Timeline Generation', function () {
        it('returns correct expected stages', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->validated()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $stages = $this->lpjService->getExpectedStages($lpj);

            expect($stages)->toHaveCount(3)
                ->and($stages[0]['stage'])->toBe(LpjApprovalStage::StaffKeuangan->value)
                ->and($stages[1]['stage'])->toBe(LpjApprovalStage::Direktur->value)
                ->and($stages[2]['stage'])->toBe(LpjApprovalStage::Keuangan->value);
        });

        it('includes correct status for each stage', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $this->lpjService->submit($lpj, $unitUser);
            $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ]);

            $lpj->refresh();
            $stages = $this->lpjService->getExpectedStages($lpj);

            // StaffKeuangan should be approved
            expect($stages[0]['status'])->toBe('approved');

            // Direktur should be current
            expect($stages[1]['status'])->toBe('current');

            // Keuangan should be future
            expect($stages[2]['status'])->toBe('future');
        });
    });
});
