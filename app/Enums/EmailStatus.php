<?php

declare(strict_types=1);

namespace App\Enums;

enum EmailStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case InProcess = 'in-process';
    case Approved = 'approved';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Sent => 'Terkirim',
            self::InProcess => 'Dalam Proses',
            self::Approved => 'Disetujui',
            self::Archived => 'Diarsipkan',
        };
    }
}
