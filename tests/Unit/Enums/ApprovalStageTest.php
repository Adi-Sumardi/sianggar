<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ProposalStatus;
use App\Enums\UserRole;

describe('ApprovalStage Enum', function () {
    it('has correct values for all stages', function () {
        expect(ApprovalStage::StaffDirektur->value)->toBe('staff-direktur');
        expect(ApprovalStage::StaffKeuangan->value)->toBe('staff-keuangan');
        expect(ApprovalStage::Direktur->value)->toBe('direktur');
        expect(ApprovalStage::KabagSdmUmum->value)->toBe('kabag-sdm-umum');
        expect(ApprovalStage::KabagSekretariat->value)->toBe('kabag-sekretariat');
        expect(ApprovalStage::WakilKetua->value)->toBe('wakil-ketua');
        expect(ApprovalStage::Sekretaris->value)->toBe('sekretaris');
        expect(ApprovalStage::Ketum->value)->toBe('ketum');
        expect(ApprovalStage::Keuangan->value)->toBe('keuangan');
        expect(ApprovalStage::Bendahara->value)->toBe('bendahara');
        expect(ApprovalStage::Kasir->value)->toBe('kasir');
        expect(ApprovalStage::Payment->value)->toBe('payment');
    });

    it('has correct required roles for each stage', function () {
        expect(ApprovalStage::StaffDirektur->requiredRole())->toBe(UserRole::StaffDirektur);
        expect(ApprovalStage::StaffKeuangan->requiredRole())->toBe(UserRole::StaffKeuangan);
        expect(ApprovalStage::Direktur->requiredRole())->toBe(UserRole::Direktur);
        expect(ApprovalStage::KabagSdmUmum->requiredRole())->toBe(UserRole::KabagSdmUmum);
        expect(ApprovalStage::KabagSekretariat->requiredRole())->toBe(UserRole::Sekretariat);
        expect(ApprovalStage::WakilKetua->requiredRole())->toBe(UserRole::Ketua1);
        expect(ApprovalStage::Sekretaris->requiredRole())->toBe(UserRole::Sekretaris);
        expect(ApprovalStage::Ketum->requiredRole())->toBe(UserRole::Ketum);
        expect(ApprovalStage::Keuangan->requiredRole())->toBe(UserRole::Keuangan);
        expect(ApprovalStage::Bendahara->requiredRole())->toBe(UserRole::Bendahara);
        expect(ApprovalStage::Kasir->requiredRole())->toBe(UserRole::Kasir);
        expect(ApprovalStage::Payment->requiredRole())->toBe(UserRole::Payment);
    });

    it('has correct labels for all stages', function () {
        expect(ApprovalStage::StaffDirektur->label())->toBe('Staf Direktur');
        expect(ApprovalStage::StaffKeuangan->label())->toBe('Staf Keuangan');
        expect(ApprovalStage::Direktur->label())->toBe('Direktur Pendidikan');
        expect(ApprovalStage::KabagSdmUmum->label())->toBe('Kabag SDM & Umum');
        expect(ApprovalStage::Ketum->label())->toBe('Ketua Umum');
        expect(ApprovalStage::Keuangan->label())->toBe('Keuangan');
        expect(ApprovalStage::Bendahara->label())->toBe('Bendahara');
        expect(ApprovalStage::Kasir->label())->toBe('Kasir');
        expect(ApprovalStage::Payment->label())->toBe('Pembayaran');
    });

    it('returns correct status after approval', function () {
        // StaffDirektur does not change status
        expect(ApprovalStage::StaffDirektur->statusAfterApproval())->toBeNull();

        // StaffKeuangan sets to ApprovedLevel1
        expect(ApprovalStage::StaffKeuangan->statusAfterApproval())->toBe(ProposalStatus::ApprovedLevel1);

        // Middle approvers set to ApprovedLevel2
        expect(ApprovalStage::Direktur->statusAfterApproval())->toBe(ProposalStatus::ApprovedLevel2);
        expect(ApprovalStage::KabagSdmUmum->statusAfterApproval())->toBe(ProposalStatus::ApprovedLevel2);
        expect(ApprovalStage::KabagSekretariat->statusAfterApproval())->toBe(ProposalStatus::ApprovedLevel2);

        // Ketum sets to ApprovedLevel3
        expect(ApprovalStage::Ketum->statusAfterApproval())->toBe(ProposalStatus::ApprovedLevel3);

        // Keuangan sets to FinalApproved
        expect(ApprovalStage::Keuangan->statusAfterApproval())->toBe(ProposalStatus::FinalApproved);

        // Bendahara sets to Done
        expect(ApprovalStage::Bendahara->statusAfterApproval())->toBe(ProposalStatus::Done);

        // Payment sets to Paid
        expect(ApprovalStage::Payment->statusAfterApproval())->toBe(ProposalStatus::Paid);
    });

    it('identifies stages that can edit amount', function () {
        // Only Keuangan and Bendahara can edit amount
        expect(ApprovalStage::Keuangan->canEditAmount())->toBeTrue();
        expect(ApprovalStage::Bendahara->canEditAmount())->toBeTrue();

        // Other stages cannot edit amount
        expect(ApprovalStage::StaffDirektur->canEditAmount())->toBeFalse();
        expect(ApprovalStage::StaffKeuangan->canEditAmount())->toBeFalse();
        expect(ApprovalStage::Direktur->canEditAmount())->toBeFalse();
        expect(ApprovalStage::Ketum->canEditAmount())->toBeFalse();
        expect(ApprovalStage::Kasir->canEditAmount())->toBeFalse();
    });

    it('identifies stages that can open discussion', function () {
        // Only Ketum can open discussion
        expect(ApprovalStage::Ketum->canOpenDiscussion())->toBeTrue();

        // Other stages cannot open discussion
        expect(ApprovalStage::StaffDirektur->canOpenDiscussion())->toBeFalse();
        expect(ApprovalStage::Keuangan->canOpenDiscussion())->toBeFalse();
        expect(ApprovalStage::Bendahara->canOpenDiscussion())->toBeFalse();
    });

    it('returns all cases', function () {
        $cases = ApprovalStage::cases();
        expect($cases)->toHaveCount(12);
    });
});
