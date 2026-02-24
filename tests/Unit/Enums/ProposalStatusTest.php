<?php

declare(strict_types=1);

use App\Enums\ProposalStatus;

describe('ProposalStatus Enum', function () {
    it('has correct values for all statuses', function () {
        expect(ProposalStatus::Draft->value)->toBe('draft');
        expect(ProposalStatus::Submitted->value)->toBe('submitted');
        expect(ProposalStatus::RevisionRequired->value)->toBe('revision-required');
        expect(ProposalStatus::Revised->value)->toBe('revised');
        expect(ProposalStatus::Rejected->value)->toBe('rejected');
        expect(ProposalStatus::ApprovedLevel1->value)->toBe('approved-level-1');
        expect(ProposalStatus::ApprovedLevel2->value)->toBe('approved-level-2');
        expect(ProposalStatus::ApprovedLevel3->value)->toBe('approved-level-3');
        expect(ProposalStatus::FinalApproved->value)->toBe('final-approved');
        expect(ProposalStatus::Done->value)->toBe('done');
        expect(ProposalStatus::Paid->value)->toBe('paid');
    });

    it('has correct labels for all statuses', function () {
        expect(ProposalStatus::Draft->label())->toBe('Draf');
        expect(ProposalStatus::Submitted->label())->toBe('Diajukan');
        expect(ProposalStatus::RevisionRequired->label())->toBe('Perlu Revisi');
        expect(ProposalStatus::Revised->label())->toBe('Sudah Direvisi');
        expect(ProposalStatus::Rejected->label())->toBe('Ditolak');
        expect(ProposalStatus::ApprovedLevel1->label())->toBe('Disetujui Level 1');
        expect(ProposalStatus::ApprovedLevel2->label())->toBe('Disetujui Level 2');
        expect(ProposalStatus::ApprovedLevel3->label())->toBe('Disetujui Level 3');
        expect(ProposalStatus::FinalApproved->label())->toBe('Disetujui Final');
        expect(ProposalStatus::Done->label())->toBe('Selesai');
        expect(ProposalStatus::Paid->label())->toBe('Dibayar');
    });

    it('has correct colors for all statuses', function () {
        expect(ProposalStatus::Draft->color())->toBe('secondary');
        expect(ProposalStatus::Submitted->color())->toBe('primary');
        expect(ProposalStatus::RevisionRequired->color())->toBe('warning');
        expect(ProposalStatus::Revised->color())->toBe('info');
        expect(ProposalStatus::Rejected->color())->toBe('danger');
        expect(ProposalStatus::ApprovedLevel1->color())->toBe('info');
        expect(ProposalStatus::FinalApproved->color())->toBe('success');
        expect(ProposalStatus::Done->color())->toBe('success');
        expect(ProposalStatus::Paid->color())->toBe('success');
    });

    it('can be created from string value', function () {
        $status = ProposalStatus::from('draft');
        expect($status)->toBe(ProposalStatus::Draft);

        $status = ProposalStatus::from('submitted');
        expect($status)->toBe(ProposalStatus::Submitted);

        $status = ProposalStatus::from('final-approved');
        expect($status)->toBe(ProposalStatus::FinalApproved);
    });

    it('returns all cases', function () {
        $cases = ProposalStatus::cases();
        expect($cases)->toHaveCount(11);
    });
});
