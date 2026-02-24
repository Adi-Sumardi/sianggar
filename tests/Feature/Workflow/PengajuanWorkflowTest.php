<?php

declare(strict_types=1);

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\ApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->approvalService = new ApprovalService();
});

describe('Complete Pengajuan Workflow', function () {
    describe('Low Amount Education Flow (< 10 Juta)', function () {
        it('follows correct approval chain for low amount education proposal', function () {
            // Setup users
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();
            $keuangan = User::factory()->keuangan()->create();
            $bendahara = User::factory()->bendahara()->create();
            $kasir = User::factory()->kasir()->create();
            $payment = User::factory()->payment()->create();

            // Create proposal with low amount (< 10M)
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            // Step 1: Submit (Unit → StaffDirektur)
            $this->approvalService->submit($pengajuan, $unitUser);
            $pengajuan->refresh();

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Submitted)
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffDirektur->value)
                ->and($pengajuan->amount_category)->toBe(AmountCategory::Low);

            // Step 2: StaffDirektur approves → StaffKeuangan
            $this->approvalService->approve($pengajuan, $staffDirektur);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value);

            // Step 3: StaffKeuangan validates → Direktur (Education reference)
            $this->approvalService->approveWithValidation($pengajuan, $staffKeuangan, [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::Education->value,
                'need_lpj' => true,
            ]);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Direktur->value)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::ApprovedLevel1)
                ->and($pengajuan->reference_type)->toBe(ReferenceType::Education);

            // Step 4: Direktur approves → Keuangan (skip WakilKetua/Ketum for LOW amount)
            $this->approvalService->approve($pengajuan, $direktur);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Keuangan->value)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::ApprovedLevel2);

            // Step 5: Keuangan approves → Bendahara
            $this->approvalService->approve($pengajuan, $keuangan);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Bendahara->value)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::FinalApproved);

            // Step 6: Bendahara approves → Kasir (voucher generated)
            $this->approvalService->approve($pengajuan, $bendahara);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Kasir->value)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::Done)
                ->and($pengajuan->no_voucher)->not->toBeNull();

            // Step 7: Kasir prints voucher → Payment
            $this->approvalService->printVoucher($pengajuan, $kasir);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Payment->value)
                ->and($pengajuan->print_status)->toBe('printed');

            // Step 8: Payment marks as paid → Complete
            $this->approvalService->markAsPaid($pengajuan, $payment, 'John Doe', 'Transfer', 'Done');
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBeNull()
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::Paid)
                ->and($pengajuan->status_payment)->toBe('paid')
                ->and($pengajuan->payment_recipient)->toBe('John Doe');

            // Verify total approvals: 7 stages (StaffDirektur, StaffKeuangan, Direktur, Keuangan, Bendahara, Kasir, Payment)
            expect($pengajuan->approvals)->toHaveCount(7);
        });
    });

    describe('High Amount Education Flow (>= 10 Juta)', function () {
        it('includes WakilKetua and Ketum for high amount education proposal', function () {
            // Setup users
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();
            $wakilKetua = User::factory()->wakilKetua()->create();
            $ketum = User::factory()->ketum()->create();
            $keuangan = User::factory()->keuangan()->create();

            // Create proposal with high amount (>= 10M)
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 15_000_000,
            ]);

            // Submit
            $this->approvalService->submit($pengajuan, $unitUser);
            expect($pengajuan->fresh()->amount_category)->toBe(AmountCategory::High);

            // StaffDirektur → StaffKeuangan
            $this->approvalService->approve($pengajuan->fresh(), $staffDirektur);

            // StaffKeuangan → Direktur
            $this->approvalService->approveWithValidation($pengajuan->fresh(), $staffKeuangan, [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::Education->value,
                'need_lpj' => false,
            ]);

            // Direktur → WakilKetua (HIGH amount goes to WakilKetua instead of Keuangan)
            $this->approvalService->approve($pengajuan->fresh(), $direktur);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::WakilKetua->value);

            // WakilKetua → Ketum
            $this->approvalService->approve($pengajuan, $wakilKetua);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Ketum->value);

            // Ketum → Keuangan
            $this->approvalService->approve($pengajuan, $ketum);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Keuangan->value)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::ApprovedLevel3);
        });
    });

    describe('HrGeneral Reference Flow', function () {
        it('routes to KabagSdmUmum for HrGeneral reference type', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $kabagSdmUmum = User::factory()->kabagSdmUmum()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            $this->approvalService->submit($pengajuan, $unitUser);
            $this->approvalService->approve($pengajuan->fresh(), $staffDirektur);

            // Validate with HrGeneral reference
            $this->approvalService->approveWithValidation($pengajuan->fresh(), $staffKeuangan, [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::HrGeneral->value,
                'need_lpj' => false,
            ]);

            $pengajuan->refresh();
            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::KabagSdmUmum->value);

            // Approve at KabagSdmUmum → goes to Keuangan (LOW amount)
            $this->approvalService->approve($pengajuan, $kabagSdmUmum);
            $pengajuan->refresh();

            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Keuangan->value);
        });
    });

    describe('Secretariat Reference Flow', function () {
        it('routes to KabagSekretariat for Secretariat reference type', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $sekretariat = User::factory()->sekretariat()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            $this->approvalService->submit($pengajuan, $unitUser);
            $this->approvalService->approve($pengajuan->fresh(), $staffDirektur);

            $this->approvalService->approveWithValidation($pengajuan->fresh(), $staffKeuangan, [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::Secretariat->value,
                'need_lpj' => false,
            ]);

            $pengajuan->refresh();
            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::KabagSekretariat->value);
        });
    });

    describe('Substansi Submission Flow', function () {
        it('starts at StaffKeuangan for substansi users', function () {
            $substansiUser = User::factory()->substansi('asrama')->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $substansiUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            $this->approvalService->submit($pengajuan, $substansiUser);

            $pengajuan->refresh();
            expect($pengajuan->submitter_type)->toBe('substansi')
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value);
        });
    });

    describe('Revision Flow', function () {
        it('returns to revision stage after resubmit', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
            ]);

            // Submit and move to StaffKeuangan
            $this->approvalService->submit($pengajuan, $unitUser);
            $this->approvalService->approve($pengajuan->fresh(), $staffDirektur);

            $pengajuan->refresh();
            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value);

            // StaffKeuangan requests revision
            $this->approvalService->revise($pengajuan, $staffKeuangan, 'Fix the calculation');

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::RevisionRequired)
                ->and($pengajuan->revision_requested_stage)->toBe(ApprovalStage::StaffKeuangan->value)
                ->and($pengajuan->current_approval_stage)->toBeNull();

            // User fixes and resubmits
            $this->approvalService->resubmit($pengajuan);

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::Revised)
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value)
                ->and($pengajuan->revision_requested_stage)->toBeNull();
        });

        it('does not restart from beginning after resubmit', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $direktur = User::factory()->direktur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
            ]);

            // Move to Direktur stage
            $this->approvalService->submit($pengajuan, $unitUser);
            $this->approvalService->approve($pengajuan->fresh(), $staffDirektur);
            $this->approvalService->approveWithValidation($pengajuan->fresh(), $staffKeuangan, [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::Education->value,
                'need_lpj' => false,
            ]);

            $pengajuan->refresh();
            $approvalCountBeforeRevision = $pengajuan->approvals()->count();

            // Direktur requests revision
            $this->approvalService->revise($pengajuan, $direktur, 'Please add justification');

            // Resubmit - should return to Direktur, not StaffDirektur
            $this->approvalService->resubmit($pengajuan->fresh());

            $pengajuan->refresh();
            expect($pengajuan->current_approval_stage)->toBe(ApprovalStage::Direktur->value)
                ->and($pengajuan->current_approval_stage)->not->toBe(ApprovalStage::StaffDirektur->value);
        });
    });

    describe('Rejection Flow', function () {
        it('ends workflow permanently when rejected', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
            ]);

            $this->approvalService->submit($pengajuan, $unitUser);
            $this->approvalService->reject($pengajuan->fresh(), $staffDirektur, 'Policy violation');

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::Rejected)
                ->and($pengajuan->current_approval_stage)->toBeNull();

            // Verify the last approval has rejected status
            $lastApproval = $pengajuan->approvals()->latest()->first();
            expect($lastApproval->status)->toBe(ApprovalStatus::Rejected);
        });
    });

    describe('Amount Edit Flow', function () {
        it('allows amount editing at Keuangan and Bendahara stages', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $keuangan = User::factory()->keuangan()->create();
            $bendahara = User::factory()->bendahara()->create();

            // Create pengajuan at Keuangan stage
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
                'status_proses' => ProposalStatus::FinalApproved->value,
                'current_approval_stage' => ApprovalStage::Keuangan->value,
            ]);

            \App\Models\Approval::factory()->pending()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::Keuangan->value,
            ]);

            // Edit amount at Keuangan
            $log = $this->approvalService->editAmount($pengajuan, $keuangan, 4_500_000, 'Price negotiation');

            expect((float) $log->original_amount)->toBe(5_000_000.0)
                ->and((float) $log->new_amount)->toBe(4_500_000.0);

            $pengajuan->refresh();
            expect((float) $pengajuan->approved_amount)->toBe(4500000.0);
        });
    });

    describe('Discussion Flow', function () {
        it('allows leadership roles to open and close discussions', function () {
            $ketum = User::factory()->ketum()->create();
            $pengajuan = PengajuanAnggaran::factory()->create();

            // Open discussion
            $discussion = $this->approvalService->openDiscussion($pengajuan, $ketum);

            expect($discussion->status)->toBe('open')
                ->and($discussion->opened_by)->toBe($ketum->id);

            // Close discussion (only opener can close)
            $closedDiscussion = $this->approvalService->closeDiscussion($pengajuan->fresh(), $ketum);

            expect($closedDiscussion->status)->toBe('closed')
                ->and($closedDiscussion->closed_by)->toBe($ketum->id);
        });
    });
});
