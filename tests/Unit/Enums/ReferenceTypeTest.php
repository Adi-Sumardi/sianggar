<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ReferenceType;

describe('ReferenceType Enum', function () {
    it('has correct values', function () {
        expect(ReferenceType::Education->value)->toBe('education');
        expect(ReferenceType::HrGeneral->value)->toBe('hr_general');
        expect(ReferenceType::Secretariat->value)->toBe('secretariat');
    });

    it('has correct labels', function () {
        expect(ReferenceType::Education->label())->toBe('Bidang Pendidikan');
        expect(ReferenceType::HrGeneral->label())->toBe('Bidang SDM & Umum');
        expect(ReferenceType::Secretariat->label())->toBe('Bidang Internal Sekretariat');
    });

    it('returns correct approval stage for each reference type', function () {
        // Education goes to Direktur
        expect(ReferenceType::Education->approvalStage())->toBe(ApprovalStage::Direktur);

        // HrGeneral goes to KabagSdmUmum
        expect(ReferenceType::HrGeneral->approvalStage())->toBe(ApprovalStage::KabagSdmUmum);

        // Secretariat goes to KabagSekretariat
        expect(ReferenceType::Secretariat->approvalStage())->toBe(ApprovalStage::KabagSekretariat);
    });

    it('returns all cases', function () {
        $cases = ReferenceType::cases();
        expect($cases)->toHaveCount(3);
    });
});
