<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Approval stages for LPJ (Laporan Pertanggungjawaban).
 *
 * Flow:
 * Unit/Substansi → StaffKeuangan (checklist + rujukan) → Middle Approver → Keuangan → Done
 *
 * Middle Approver is determined by reference_type:
 * - Education → Direktur
 * - HrGeneral → KabagSdmUmum
 * - Secretariat → KabagSekretariat
 */
enum LpjApprovalStage: string
{
    case StaffKeuangan = 'staff-keuangan';
    case Direktur = 'direktur';
    case KabagSdmUmum = 'kabag-sdm-umum';
    case KabagSekretariat = 'kabag-sekretariat';
    case Keuangan = 'keuangan';

    /**
     * Get the UserRole required to approve this stage.
     */
    public function requiredRole(): UserRole
    {
        return match ($this) {
            self::StaffKeuangan => UserRole::StaffKeuangan,
            self::Direktur => UserRole::Direktur,
            self::KabagSdmUmum => UserRole::KabagSdmUmum,
            self::KabagSekretariat => UserRole::Sekretariat,
            self::Keuangan => UserRole::Keuangan,
        };
    }

    /**
     * Get display label for this stage.
     */
    public function label(): string
    {
        return match ($this) {
            self::StaffKeuangan => 'Staf Keuangan',
            self::Direktur => 'Direktur Pendidikan',
            self::KabagSdmUmum => 'Kabag SDM & Umum',
            self::KabagSekretariat => 'Kabag Sekretariat',
            self::Keuangan => 'Keuangan',
        };
    }

    /**
     * Get the stage order (1-indexed).
     */
    public function order(): int
    {
        return match ($this) {
            self::StaffKeuangan => 1,
            self::Direktur, self::KabagSdmUmum, self::KabagSekretariat => 2,
            self::Keuangan => 3,
        };
    }

    /**
     * Check if this is a middle approver stage.
     */
    public function isMiddleApprover(): bool
    {
        return in_array($this, [
            self::Direktur,
            self::KabagSdmUmum,
            self::KabagSekretariat,
        ], true);
    }

    /**
     * Get the middle approver stage based on reference type.
     */
    public static function fromReferenceType(ReferenceType $referenceType): self
    {
        return match ($referenceType) {
            ReferenceType::Education => self::Direktur,
            ReferenceType::HrGeneral => self::KabagSdmUmum,
            ReferenceType::Secretariat => self::KabagSekretariat,
        };
    }
}
