<?php

declare(strict_types=1);

namespace App\Enums;

enum PerubahanApprovalStage: string
{
    case Direktur = 'direktur';              // First stage for Unit submitters
    case KabagSekretariat = 'kabag-sekretariat';  // First stage for Substansi submitters
    case WakilKetua = 'wakil-ketua';          // Second stage for Unit path
    case Sekretaris = 'sekretaris';           // Second stage for Substansi path
    case Ketum = 'ketum';                     // Third stage (both paths converge)
    case Keuangan = 'keuangan';               // Fourth stage
    case Bendahara = 'bendahara';             // Final stage (executes transfer)

    public function requiredRole(): UserRole
    {
        return match ($this) {
            self::Direktur => UserRole::Direktur,
            self::KabagSekretariat => UserRole::Sekretariat,
            self::WakilKetua => UserRole::Ketua1,
            self::Sekretaris => UserRole::Sekretaris,
            self::Ketum => UserRole::Ketum,
            self::Keuangan => UserRole::Keuangan,
            self::Bendahara => UserRole::Bendahara,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Direktur => 'Direktur Pendidikan',
            self::KabagSekretariat => 'Kabag Sekretariat',
            self::WakilKetua => 'Wakil Ketua',
            self::Sekretaris => 'Sekretaris',
            self::Ketum => 'Ketua Umum',
            self::Keuangan => 'Keuangan',
            self::Bendahara => 'Bendahara',
        };
    }

    public function statusAfterApproval(): PerubahanAnggaranStatus
    {
        return match ($this) {
            self::Direktur, self::KabagSekretariat => PerubahanAnggaranStatus::ApprovedLevel1,
            self::WakilKetua, self::Sekretaris => PerubahanAnggaranStatus::ApprovedLevel2,
            self::Ketum => PerubahanAnggaranStatus::ApprovedLevel3,
            self::Keuangan => PerubahanAnggaranStatus::ApprovedLevel4,
            self::Bendahara => PerubahanAnggaranStatus::Processed,
        };
    }

    public function stageOrder(): int
    {
        return match ($this) {
            self::Direktur, self::KabagSekretariat => 1,
            self::WakilKetua, self::Sekretaris => 2,
            self::Ketum => 3,
            self::Keuangan => 4,
            self::Bendahara => 5,
        };
    }

    public function isExecutionStage(): bool
    {
        return $this === self::Bendahara;
    }

    /**
     * Get the first approval stage based on submitter type.
     */
    public static function getInitialStage(string $submitterType): self
    {
        return match ($submitterType) {
            'unit' => self::Direktur,
            'substansi' => self::KabagSekretariat,
            default => self::Direktur,
        };
    }

    /**
     * Get the next approval stage in the workflow.
     */
    public function getNextStage(): ?self
    {
        return match ($this) {
            self::Direktur => self::WakilKetua,
            self::KabagSekretariat => self::Sekretaris,
            self::WakilKetua => self::Ketum,
            self::Sekretaris => self::Ketum,
            self::Ketum => self::Keuangan,
            self::Keuangan => self::Bendahara,
            self::Bendahara => null,  // End of workflow
        };
    }

    /**
     * Get all stages for Unit submitter path.
     *
     * @return array<self>
     */
    public static function getUnitPath(): array
    {
        return [
            self::Direktur,
            self::WakilKetua,
            self::Ketum,
            self::Keuangan,
            self::Bendahara,
        ];
    }

    /**
     * Get all stages for Substansi submitter path.
     *
     * @return array<self>
     */
    public static function getSubstansiPath(): array
    {
        return [
            self::KabagSekretariat,
            self::Sekretaris,
            self::Ketum,
            self::Keuangan,
            self::Bendahara,
        ];
    }

    /**
     * Get all expected stages based on submitter type.
     *
     * @return array<self>
     */
    public static function getExpectedStages(string $submitterType): array
    {
        return match ($submitterType) {
            'unit' => self::getUnitPath(),
            'substansi' => self::getSubstansiPath(),
            default => self::getUnitPath(),
        };
    }
}
