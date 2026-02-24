<?php

declare(strict_types=1);

namespace App\Enums;

enum ApprovalStage: string
{
    case StaffDirektur = 'staff-direktur';
    case StaffKeuangan = 'staff-keuangan';
    case Direktur = 'direktur';
    case KabagSdmUmum = 'kabag-sdm-umum';
    case KabagSekretariat = 'kabag-sekretariat';
    case WakilKetua = 'wakil-ketua';
    case Sekretaris = 'sekretaris';
    case Ketum = 'ketum';
    case Keuangan = 'keuangan';
    case Bendahara = 'bendahara';
    case Kasir = 'kasir';
    case Payment = 'payment';

    public function requiredRole(): UserRole
    {
        return match ($this) {
            self::StaffDirektur => UserRole::StaffDirektur,
            self::StaffKeuangan => UserRole::StaffKeuangan,
            self::Direktur => UserRole::Direktur,
            self::KabagSdmUmum => UserRole::KabagSdmUmum,
            self::KabagSekretariat => UserRole::Sekretariat,
            self::WakilKetua => UserRole::Ketua1,
            self::Sekretaris => UserRole::Sekretaris,
            self::Ketum => UserRole::Ketum,
            self::Keuangan => UserRole::Keuangan,
            self::Bendahara => UserRole::Bendahara,
            self::Kasir => UserRole::Kasir,
            self::Payment => UserRole::Payment,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::StaffDirektur => 'Staf Direktur',
            self::StaffKeuangan => 'Staf Keuangan',
            self::Direktur => 'Direktur Pendidikan',
            self::KabagSdmUmum => 'Kabag SDM & Umum',
            self::KabagSekretariat => 'Kabag Sekretariat',
            self::WakilKetua => 'Wakil Ketua',
            self::Sekretaris => 'Sekretaris',
            self::Ketum => 'Ketua Umum',
            self::Keuangan => 'Keuangan',
            self::Bendahara => 'Bendahara',
            self::Kasir => 'Kasir',
            self::Payment => 'Pembayaran',
        };
    }

    public function statusAfterApproval(): ?ProposalStatus
    {
        return match ($this) {
            self::StaffDirektur => null,
            self::StaffKeuangan => ProposalStatus::ApprovedLevel1,
            self::Direktur, self::KabagSdmUmum, self::KabagSekretariat => ProposalStatus::ApprovedLevel2,
            self::WakilKetua, self::Sekretaris => null,
            self::Ketum => ProposalStatus::ApprovedLevel3,
            self::Keuangan => ProposalStatus::FinalApproved,
            self::Bendahara => ProposalStatus::Done,
            self::Kasir => null,
            self::Payment => ProposalStatus::Paid,
        };
    }

    public function canEditAmount(): bool
    {
        return in_array($this, [self::Keuangan, self::Bendahara]);
    }

    public function canOpenDiscussion(): bool
    {
        return $this === self::Ketum;
    }
}
