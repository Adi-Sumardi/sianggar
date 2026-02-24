<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Direktur = 'direktur';
    case Ketua = 'ketua';
    case Ketua1 = 'ketua-1';
    case Ketum = 'ketum';
    case Sekretariat = 'sekretariat';
    case Sekretaris = 'sekretaris';
    case Bendahara = 'bendahara';
    case Keuangan = 'keuangan';
    case Akuntansi = 'akuntansi';
    case Kasir = 'kasir';
    case Payment = 'payment';
    case SDM = 'sdm';
    case Umum = 'umum';
    case KabagSdmUmum = 'kabag-sdm-umum';
    case StaffDirektur = 'staff-direktur';
    case StaffSekretariat = 'staff-sekretariat';
    case StaffKeuangan = 'staff-keuangan';
    case PG = 'pg';
    case RA = 'ra';
    case TK = 'tk';
    case SD = 'sd';
    case SMP12 = 'smp12';
    case SMP55 = 'smp55';
    case SMA33 = 'sma33';
    case Stebank = 'stebank';
    case Unit = 'unit';
    case Asrama = 'asrama';
    case Litbang = 'litbang';
    case Laz = 'laz';
    case Pembangunan = 'pembangunan';
    case Yta = 'yta';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Direktur => 'Direktur',
            self::Ketua => 'Ketua',
            self::Ketua1 => 'Wakil Ketua',
            self::Ketum => 'Ketua Umum',
            self::Sekretariat => 'Sekretariat',
            self::Sekretaris => 'Sekretaris',
            self::Bendahara => 'Bendahara',
            self::Keuangan => 'Keuangan',
            self::Akuntansi => 'Akuntansi',
            self::Kasir => 'Kasir',
            self::Payment => 'Payment',
            self::SDM => 'SDM',
            self::Umum => 'Umum',
            self::KabagSdmUmum => 'Kabag SDM & Umum',
            self::StaffDirektur => 'Staff Direktur',
            self::StaffSekretariat => 'Staff Sekretariat',
            self::StaffKeuangan => 'Staff Keuangan',
            self::PG => 'PG',
            self::RA => 'RA',
            self::TK => 'TK',
            self::SD => 'SD',
            self::SMP12 => 'SMP 12',
            self::SMP55 => 'SMP 55',
            self::SMA33 => 'SMA 33',
            self::Stebank => 'STEBANK',
            self::Unit => 'Unit',
            self::Asrama => 'Asrama',
            self::Litbang => 'Litbang',
            self::Laz => 'LAZ',
            self::Pembangunan => 'Pembangunan',
            self::Yta => 'YTA',
        };
    }

    public function isUnit(): bool
    {
        return in_array($this, [
            self::PG,
            self::RA,
            self::TK,
            self::SD,
            self::SMP12,
            self::SMP55,
            self::SMA33,
        ]);
    }

    public function isSubstansi(): bool
    {
        return in_array($this, [
            self::Asrama,
            self::Laz,
            self::Litbang,
            self::Stebank,
            self::StaffDirektur,
            self::StaffSekretariat,
            self::SDM,
            self::Umum,
            self::Yta,
        ]);
    }

    public function isApprover(): bool
    {
        return in_array($this, [
            self::Direktur,
            self::Ketua,
            self::Ketua1,
            self::Ketum,
            self::Sekretariat,
            self::Sekretaris,
            self::Bendahara,
            self::Keuangan,
            self::Kasir,
            self::Payment,
            self::StaffKeuangan,
            self::KabagSdmUmum,
            self::StaffDirektur,
        ]);
    }

    public function canCreateProposal(): bool
    {
        return $this === self::Admin || $this->isUnit() || $this->isSubstansi();
    }

    public function canCreateLpj(): bool
    {
        return $this === self::Admin || $this->isUnit() || $this->isSubstansi();
    }

    public function dashboardType(): string
    {
        if ($this === self::Admin) {
            return 'admin';
        }

        if ($this->isUnit()) {
            return 'unit';
        }

        if ($this === self::Kasir) {
            return 'kasir';
        }

        if ($this === self::Payment) {
            return 'payment';
        }

        if (in_array($this, [self::Keuangan, self::StaffKeuangan, self::Bendahara, self::Akuntansi])) {
            return 'finance';
        }

        if (in_array($this, [self::Direktur, self::Ketua, self::Ketua1, self::Ketum])) {
            return 'leadership';
        }

        return 'approver';
    }

    /**
     * Check if this role can view all data (not filtered by own unit).
     * Admin and Approver roles can view all data.
     */
    public function canViewAllData(): bool
    {
        return $this === self::Admin || $this->isApprover();
    }

    /**
     * Check if this role should be filtered to only see their own data.
     * Unit and Substansi roles should only see their own data.
     */
    public function shouldFilterByOwnData(): bool
    {
        return $this->isUnit() || $this->isSubstansi();
    }
}
