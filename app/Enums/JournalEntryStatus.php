<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Status for JournalEntry (Bukti Jurnal).
 *
 * Flow: Draft -> Posted (mempengaruhi saldo buku besar) -> Reversed (dibalik via entry baru)
 */
enum JournalEntryStatus: string
{
    case Draft = 'draft';
    case Posted = 'posted';
    case Reversed = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Posted => 'Terposting',
            self::Reversed => 'Dibalik',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Posted => 'success',
            self::Reversed => 'warning',
        };
    }
}
