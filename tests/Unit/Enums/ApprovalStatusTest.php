<?php

declare(strict_types=1);

use App\Enums\ApprovalStatus;

describe('ApprovalStatus Enum', function () {
    it('has correct values', function () {
        expect(ApprovalStatus::Pending->value)->toBe('pending');
        expect(ApprovalStatus::Approved->value)->toBe('approved');
        expect(ApprovalStatus::Revised->value)->toBe('revised');
        expect(ApprovalStatus::Rejected->value)->toBe('rejected');
    });

    it('has correct labels', function () {
        expect(ApprovalStatus::Pending->label())->toBe('Menunggu');
        expect(ApprovalStatus::Approved->label())->toBe('Disetujui');
        expect(ApprovalStatus::Revised->label())->toBe('Direvisi');
        expect(ApprovalStatus::Rejected->label())->toBe('Ditolak');
    });

    it('has correct colors', function () {
        expect(ApprovalStatus::Pending->color())->toBe('warning');
        expect(ApprovalStatus::Approved->color())->toBe('success');
        expect(ApprovalStatus::Revised->color())->toBe('info');
        expect(ApprovalStatus::Rejected->color())->toBe('danger');
    });

    it('returns all cases', function () {
        $cases = ApprovalStatus::cases();
        expect($cases)->toHaveCount(4);
    });
});
