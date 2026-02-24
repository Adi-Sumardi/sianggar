<?php

declare(strict_types=1);

use App\Enums\LpjStatus;

describe('LpjStatus Enum', function () {
    it('has correct values', function () {
        expect(LpjStatus::Draft->value)->toBe('draft');
        expect(LpjStatus::Submitted->value)->toBe('submitted');
        expect(LpjStatus::Validated->value)->toBe('validated');
        expect(LpjStatus::ApprovedByMiddle->value)->toBe('approved-middle');
        expect(LpjStatus::Approved->value)->toBe('approved');
        expect(LpjStatus::Revised->value)->toBe('revised');
        expect(LpjStatus::Rejected->value)->toBe('rejected');
    });

    it('has correct labels', function () {
        expect(LpjStatus::Draft->label())->toBe('Draf');
        expect(LpjStatus::Submitted->label())->toBe('Diajukan');
        expect(LpjStatus::Validated->label())->toBe('Divalidasi');
        expect(LpjStatus::ApprovedByMiddle->label())->toBe('Disetujui Bidang');
        expect(LpjStatus::Approved->label())->toBe('Disetujui');
        expect(LpjStatus::Revised->label())->toBe('Perlu Revisi');
        expect(LpjStatus::Rejected->label())->toBe('Ditolak');
    });

    it('has correct colors', function () {
        expect(LpjStatus::Draft->color())->toBe('secondary');
        expect(LpjStatus::Submitted->color())->toBe('primary');
        expect(LpjStatus::Validated->color())->toBe('info');
        expect(LpjStatus::ApprovedByMiddle->color())->toBe('info');
        expect(LpjStatus::Approved->color())->toBe('success');
        expect(LpjStatus::Revised->color())->toBe('warning');
        expect(LpjStatus::Rejected->color())->toBe('danger');
    });

    describe('isEditable', function () {
        it('returns true for Draft and Revised', function () {
            expect(LpjStatus::Draft->isEditable())->toBeTrue();
            expect(LpjStatus::Revised->isEditable())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(LpjStatus::Submitted->isEditable())->toBeFalse();
            expect(LpjStatus::Validated->isEditable())->toBeFalse();
            expect(LpjStatus::ApprovedByMiddle->isEditable())->toBeFalse();
            expect(LpjStatus::Approved->isEditable())->toBeFalse();
            expect(LpjStatus::Rejected->isEditable())->toBeFalse();
        });
    });

    describe('isFinal', function () {
        it('returns true for Approved and Rejected', function () {
            expect(LpjStatus::Approved->isFinal())->toBeTrue();
            expect(LpjStatus::Rejected->isFinal())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(LpjStatus::Draft->isFinal())->toBeFalse();
            expect(LpjStatus::Submitted->isFinal())->toBeFalse();
            expect(LpjStatus::Validated->isFinal())->toBeFalse();
            expect(LpjStatus::ApprovedByMiddle->isFinal())->toBeFalse();
            expect(LpjStatus::Revised->isFinal())->toBeFalse();
        });
    });

    describe('isInWorkflow', function () {
        it('returns true for workflow statuses', function () {
            expect(LpjStatus::Submitted->isInWorkflow())->toBeTrue();
            expect(LpjStatus::Validated->isInWorkflow())->toBeTrue();
            expect(LpjStatus::ApprovedByMiddle->isInWorkflow())->toBeTrue();
        });

        it('returns false for non-workflow statuses', function () {
            expect(LpjStatus::Draft->isInWorkflow())->toBeFalse();
            expect(LpjStatus::Approved->isInWorkflow())->toBeFalse();
            expect(LpjStatus::Revised->isInWorkflow())->toBeFalse();
            expect(LpjStatus::Rejected->isInWorkflow())->toBeFalse();
        });
    });
});
