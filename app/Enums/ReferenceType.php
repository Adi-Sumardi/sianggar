<?php

declare(strict_types=1);

namespace App\Enums;

enum ReferenceType: string
{
    case Education = 'education';
    case HrGeneral = 'hr_general';
    case Secretariat = 'secretariat';

    public function label(): string
    {
        return match ($this) {
            self::Education => 'Bidang Pendidikan',
            self::HrGeneral => 'Bidang SDM & Umum',
            self::Secretariat => 'Bidang Internal Sekretariat',
        };
    }

    public function approvalStage(): ApprovalStage
    {
        return match ($this) {
            self::Education => ApprovalStage::Direktur,
            self::HrGeneral => ApprovalStage::KabagSdmUmum,
            self::Secretariat => ApprovalStage::KabagSekretariat,
        };
    }
}
