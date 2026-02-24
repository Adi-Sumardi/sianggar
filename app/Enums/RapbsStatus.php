<?php

declare(strict_types=1);

namespace App\Enums;

enum RapbsStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Verified = 'verified';
    case InReview = 'in_review';
    case Approved = 'approved';
    case ApbsGenerated = 'apbs_generated';
    case Active = 'active';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Diajukan',
            self::Verified => 'Terverifikasi',
            self::InReview => 'Dalam Review',
            self::Approved => 'Disetujui',
            self::ApbsGenerated => 'APBS Tergenerate',
            self::Active => 'Anggaran Aktif',
            self::Rejected => 'Ditolak',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Submitted => 'blue',
            self::Verified => 'cyan',
            self::InReview => 'yellow',
            self::Approved => 'green',
            self::ApbsGenerated => 'emerald',
            self::Active => 'teal',
            self::Rejected => 'red',
        };
    }

    public function canEdit(): bool
    {
        return $this === self::Draft || $this === self::Rejected;
    }

    public function canSubmit(): bool
    {
        return $this === self::Draft;
    }

    /**
     * Check if this status indicates the RAPBS is in an approval process.
     */
    public function isInApprovalProcess(): bool
    {
        return in_array($this, [self::Submitted, self::Verified, self::InReview]);
    }

    /**
     * Check if this status indicates the RAPBS has been fully approved.
     */
    public function isFullyApproved(): bool
    {
        return in_array($this, [self::Approved, self::ApbsGenerated, self::Active]);
    }
}
