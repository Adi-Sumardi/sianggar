<?php

declare(strict_types=1);

namespace App\Enums;

enum ApprovalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Revised = 'revised';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu',
            self::Approved => 'Disetujui',
            self::Revised => 'Direvisi',
            self::Rejected => 'Ditolak',
            self::Withdrawn => 'Ditarik',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Approved => 'success',
            self::Revised => 'info',
            self::Rejected => 'danger',
            self::Withdrawn => 'secondary',
        };
    }
}
