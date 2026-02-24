<?php

declare(strict_types=1);

namespace App\Enums;

enum PerubahanAnggaranStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case RevisionRequired = 'revision-required';
    case Rejected = 'rejected';
    case ApprovedLevel1 = 'approved-level-1';  // Direktur/Kabag Sekretariat approved
    case ApprovedLevel2 = 'approved-level-2';  // Wakil Ketua/Sekretaris approved
    case ApprovedLevel3 = 'approved-level-3';  // Ketum approved
    case ApprovedLevel4 = 'approved-level-4';  // Keuangan approved
    case Processed = 'processed';              // Bendahara approved & executed

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Submitted => 'Diajukan',
            self::RevisionRequired => 'Perlu Revisi',
            self::Rejected => 'Ditolak',
            self::ApprovedLevel1 => 'Disetujui Direktur/Kabag',
            self::ApprovedLevel2 => 'Disetujui Wakil Ketua/Sekretaris',
            self::ApprovedLevel3 => 'Disetujui Ketua Umum',
            self::ApprovedLevel4 => 'Disetujui Keuangan',
            self::Processed => 'Diproses',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Submitted => 'primary',
            self::RevisionRequired => 'warning',
            self::Rejected => 'danger',
            self::ApprovedLevel1, self::ApprovedLevel2, self::ApprovedLevel3, self::ApprovedLevel4 => 'info',
            self::Processed => 'success',
        };
    }

    public function isEditable(): bool
    {
        return in_array($this, [self::Draft, self::RevisionRequired]);
    }

    public function isSubmittable(): bool
    {
        return in_array($this, [self::Draft, self::RevisionRequired]);
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Rejected, self::Processed]);
    }
}
