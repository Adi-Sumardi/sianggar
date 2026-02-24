<?php

declare(strict_types=1);

use App\Enums\RapbsStatus;

describe('RapbsStatus Enum', function () {
    it('has expected cases', function () {
        $cases = RapbsStatus::cases();

        expect($cases)->toHaveCount(8)
            ->and(RapbsStatus::Draft->value)->toBe('draft')
            ->and(RapbsStatus::Submitted->value)->toBe('submitted')
            ->and(RapbsStatus::Verified->value)->toBe('verified')
            ->and(RapbsStatus::InReview->value)->toBe('in_review')
            ->and(RapbsStatus::Approved->value)->toBe('approved')
            ->and(RapbsStatus::ApbsGenerated->value)->toBe('apbs_generated')
            ->and(RapbsStatus::Active->value)->toBe('active')
            ->and(RapbsStatus::Rejected->value)->toBe('rejected');
    });

    it('returns correct labels', function () {
        expect(RapbsStatus::Draft->label())->toBe('Draft')
            ->and(RapbsStatus::Submitted->label())->toBe('Diajukan')
            ->and(RapbsStatus::Verified->label())->toBe('Terverifikasi')
            ->and(RapbsStatus::InReview->label())->toBe('Dalam Review')
            ->and(RapbsStatus::Approved->label())->toBe('Disetujui')
            ->and(RapbsStatus::ApbsGenerated->label())->toBe('APBS Tergenerate')
            ->and(RapbsStatus::Active->label())->toBe('Anggaran Aktif')
            ->and(RapbsStatus::Rejected->label())->toBe('Ditolak');
    });

    it('returns correct colors', function () {
        expect(RapbsStatus::Draft->color())->toBe('gray')
            ->and(RapbsStatus::Submitted->color())->toBe('blue')
            ->and(RapbsStatus::Verified->color())->toBe('cyan')
            ->and(RapbsStatus::InReview->color())->toBe('yellow')
            ->and(RapbsStatus::Approved->color())->toBe('green')
            ->and(RapbsStatus::ApbsGenerated->color())->toBe('emerald')
            ->and(RapbsStatus::Active->color())->toBe('teal')
            ->and(RapbsStatus::Rejected->color())->toBe('red');
    });

    describe('canEdit', function () {
        it('returns true for draft status', function () {
            expect(RapbsStatus::Draft->canEdit())->toBeTrue();
        });

        it('returns true for rejected status', function () {
            expect(RapbsStatus::Rejected->canEdit())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(RapbsStatus::Submitted->canEdit())->toBeFalse()
                ->and(RapbsStatus::Verified->canEdit())->toBeFalse()
                ->and(RapbsStatus::InReview->canEdit())->toBeFalse()
                ->and(RapbsStatus::Approved->canEdit())->toBeFalse()
                ->and(RapbsStatus::ApbsGenerated->canEdit())->toBeFalse()
                ->and(RapbsStatus::Active->canEdit())->toBeFalse();
        });
    });

    describe('canSubmit', function () {
        it('returns true only for draft status', function () {
            expect(RapbsStatus::Draft->canSubmit())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(RapbsStatus::Submitted->canSubmit())->toBeFalse()
                ->and(RapbsStatus::Verified->canSubmit())->toBeFalse()
                ->and(RapbsStatus::InReview->canSubmit())->toBeFalse()
                ->and(RapbsStatus::Approved->canSubmit())->toBeFalse()
                ->and(RapbsStatus::ApbsGenerated->canSubmit())->toBeFalse()
                ->and(RapbsStatus::Active->canSubmit())->toBeFalse()
                ->and(RapbsStatus::Rejected->canSubmit())->toBeFalse();
        });
    });

    describe('isInApprovalProcess', function () {
        it('returns true for statuses in approval process', function () {
            expect(RapbsStatus::Submitted->isInApprovalProcess())->toBeTrue()
                ->and(RapbsStatus::Verified->isInApprovalProcess())->toBeTrue()
                ->and(RapbsStatus::InReview->isInApprovalProcess())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(RapbsStatus::Draft->isInApprovalProcess())->toBeFalse()
                ->and(RapbsStatus::Approved->isInApprovalProcess())->toBeFalse()
                ->and(RapbsStatus::ApbsGenerated->isInApprovalProcess())->toBeFalse()
                ->and(RapbsStatus::Active->isInApprovalProcess())->toBeFalse()
                ->and(RapbsStatus::Rejected->isInApprovalProcess())->toBeFalse();
        });
    });

    describe('isFullyApproved', function () {
        it('returns true for fully approved statuses', function () {
            expect(RapbsStatus::Approved->isFullyApproved())->toBeTrue()
                ->and(RapbsStatus::ApbsGenerated->isFullyApproved())->toBeTrue()
                ->and(RapbsStatus::Active->isFullyApproved())->toBeTrue();
        });

        it('returns false for other statuses', function () {
            expect(RapbsStatus::Draft->isFullyApproved())->toBeFalse()
                ->and(RapbsStatus::Submitted->isFullyApproved())->toBeFalse()
                ->and(RapbsStatus::Verified->isFullyApproved())->toBeFalse()
                ->and(RapbsStatus::InReview->isFullyApproved())->toBeFalse()
                ->and(RapbsStatus::Rejected->isFullyApproved())->toBeFalse();
        });
    });
});
