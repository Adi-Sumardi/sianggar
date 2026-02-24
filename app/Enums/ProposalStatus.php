<?php

declare(strict_types=1);

namespace App\Enums;

enum ProposalStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case RevisionRequired = 'revision-required';
    case Revised = 'revised';
    case Rejected = 'rejected';
    case ApprovedLevel1 = 'approved-level-1';
    case ApprovedLevel2 = 'approved-level-2';
    case ApprovedLevel3 = 'approved-level-3';
    case FinalApproved = 'final-approved';
    case Done = 'done';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Submitted => 'Diajukan',
            self::RevisionRequired => 'Perlu Revisi',
            self::Revised => 'Sudah Direvisi',
            self::Rejected => 'Ditolak',
            self::ApprovedLevel1 => 'Disetujui Level 1',
            self::ApprovedLevel2 => 'Disetujui Level 2',
            self::ApprovedLevel3 => 'Disetujui Level 3',
            self::FinalApproved => 'Disetujui Final',
            self::Done => 'Selesai',
            self::Paid => 'Dibayar',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Submitted => 'primary',
            self::RevisionRequired => 'warning',
            self::Revised => 'info',
            self::Rejected => 'danger',
            self::ApprovedLevel1, self::ApprovedLevel2, self::ApprovedLevel3 => 'info',
            self::FinalApproved => 'success',
            self::Done => 'success',
            self::Paid => 'success',
        };
    }
}
