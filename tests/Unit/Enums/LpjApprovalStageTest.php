<?php

declare(strict_types=1);

use App\Enums\LpjApprovalStage;
use App\Enums\ReferenceType;
use App\Enums\UserRole;

describe('LpjApprovalStage Enum', function () {
    it('has correct values', function () {
        expect(LpjApprovalStage::StaffKeuangan->value)->toBe('staff-keuangan');
        expect(LpjApprovalStage::Direktur->value)->toBe('direktur');
        expect(LpjApprovalStage::KabagSdmUmum->value)->toBe('kabag-sdm-umum');
        expect(LpjApprovalStage::KabagSekretariat->value)->toBe('kabag-sekretariat');
        expect(LpjApprovalStage::Keuangan->value)->toBe('keuangan');
    });

    it('has correct required roles', function () {
        expect(LpjApprovalStage::StaffKeuangan->requiredRole())->toBe(UserRole::StaffKeuangan);
        expect(LpjApprovalStage::Direktur->requiredRole())->toBe(UserRole::Direktur);
        expect(LpjApprovalStage::KabagSdmUmum->requiredRole())->toBe(UserRole::KabagSdmUmum);
        expect(LpjApprovalStage::KabagSekretariat->requiredRole())->toBe(UserRole::Sekretariat);
        expect(LpjApprovalStage::Keuangan->requiredRole())->toBe(UserRole::Keuangan);
    });

    it('has correct labels', function () {
        expect(LpjApprovalStage::StaffKeuangan->label())->toBe('Staf Keuangan');
        expect(LpjApprovalStage::Direktur->label())->toBe('Direktur Pendidikan');
        expect(LpjApprovalStage::KabagSdmUmum->label())->toBe('Kabag SDM & Umum');
        expect(LpjApprovalStage::KabagSekretariat->label())->toBe('Kabag Sekretariat');
        expect(LpjApprovalStage::Keuangan->label())->toBe('Keuangan');
    });

    describe('order', function () {
        it('returns correct order for each stage', function () {
            expect(LpjApprovalStage::StaffKeuangan->order())->toBe(1);
            expect(LpjApprovalStage::Direktur->order())->toBe(2);
            expect(LpjApprovalStage::KabagSdmUmum->order())->toBe(2);
            expect(LpjApprovalStage::KabagSekretariat->order())->toBe(2);
            expect(LpjApprovalStage::Keuangan->order())->toBe(3);
        });
    });

    describe('isMiddleApprover', function () {
        it('returns true for middle approver stages', function () {
            expect(LpjApprovalStage::Direktur->isMiddleApprover())->toBeTrue();
            expect(LpjApprovalStage::KabagSdmUmum->isMiddleApprover())->toBeTrue();
            expect(LpjApprovalStage::KabagSekretariat->isMiddleApprover())->toBeTrue();
        });

        it('returns false for non-middle approver stages', function () {
            expect(LpjApprovalStage::StaffKeuangan->isMiddleApprover())->toBeFalse();
            expect(LpjApprovalStage::Keuangan->isMiddleApprover())->toBeFalse();
        });
    });

    describe('fromReferenceType', function () {
        it('returns correct stage for Education reference type', function () {
            $stage = LpjApprovalStage::fromReferenceType(ReferenceType::Education);
            expect($stage)->toBe(LpjApprovalStage::Direktur);
        });

        it('returns correct stage for HrGeneral reference type', function () {
            $stage = LpjApprovalStage::fromReferenceType(ReferenceType::HrGeneral);
            expect($stage)->toBe(LpjApprovalStage::KabagSdmUmum);
        });

        it('returns correct stage for Secretariat reference type', function () {
            $stage = LpjApprovalStage::fromReferenceType(ReferenceType::Secretariat);
            expect($stage)->toBe(LpjApprovalStage::KabagSekretariat);
        });
    });

    it('returns all cases', function () {
        $cases = LpjApprovalStage::cases();
        expect($cases)->toHaveCount(5);
    });
});
