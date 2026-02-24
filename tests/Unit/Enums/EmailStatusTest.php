<?php

declare(strict_types=1);

use App\Enums\EmailStatus;

describe('EmailStatus Enum', function () {
    it('has expected cases', function () {
        $cases = EmailStatus::cases();

        expect($cases)->toHaveCount(5)
            ->and(EmailStatus::Draft->value)->toBe('draft')
            ->and(EmailStatus::Sent->value)->toBe('sent')
            ->and(EmailStatus::InProcess->value)->toBe('in-process')
            ->and(EmailStatus::Approved->value)->toBe('approved')
            ->and(EmailStatus::Archived->value)->toBe('archived');
    });

    it('returns correct labels', function () {
        expect(EmailStatus::Draft->label())->toBe('Draf')
            ->and(EmailStatus::Sent->label())->toBe('Terkirim')
            ->and(EmailStatus::InProcess->label())->toBe('Dalam Proses')
            ->and(EmailStatus::Approved->label())->toBe('Disetujui')
            ->and(EmailStatus::Archived->label())->toBe('Diarsipkan');
    });

    it('can be created from string value', function () {
        expect(EmailStatus::from('draft'))->toBe(EmailStatus::Draft)
            ->and(EmailStatus::from('sent'))->toBe(EmailStatus::Sent)
            ->and(EmailStatus::from('in-process'))->toBe(EmailStatus::InProcess)
            ->and(EmailStatus::from('approved'))->toBe(EmailStatus::Approved)
            ->and(EmailStatus::from('archived'))->toBe(EmailStatus::Archived);
    });

    it('throws exception for invalid value', function () {
        expect(fn () => EmailStatus::from('invalid'))->toThrow(ValueError::class);
    });

    it('tryFrom returns null for invalid value', function () {
        expect(EmailStatus::tryFrom('invalid'))->toBeNull();
    });
});
