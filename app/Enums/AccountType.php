<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Tipe akun Chart of Accounts (buku besar).
 */
enum AccountType: string
{
    case Aset = 'aset';
    case Kewajiban = 'kewajiban';
    case Ekuitas = 'ekuitas';
    case Pendapatan = 'pendapatan';
    case Beban = 'beban';

    public function label(): string
    {
        return match ($this) {
            self::Aset => 'Aset',
            self::Kewajiban => 'Kewajiban',
            self::Ekuitas => 'Ekuitas',
            self::Pendapatan => 'Pendapatan',
            self::Beban => 'Beban',
        };
    }

    /**
     * Saldo normal untuk tipe akun ini (debit untuk Aset/Beban, kredit untuk sisanya).
     */
    public function normalBalance(): NormalBalance
    {
        return match ($this) {
            self::Aset, self::Beban => NormalBalance::Debit,
            self::Kewajiban, self::Ekuitas, self::Pendapatan => NormalBalance::Kredit,
        };
    }
}
