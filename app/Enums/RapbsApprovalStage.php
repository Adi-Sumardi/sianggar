<?php

declare(strict_types=1);

namespace App\Enums;

enum RapbsApprovalStage: string
{
    // Flow untuk Unit
    case Direktur = 'direktur';
    // Flow untuk Substansi
    case Sekretariat = 'sekretariat';
    // Common flow
    case Keuangan = 'keuangan';
    case Sekretaris = 'sekretaris';
    case WakilKetua = 'wakil_ketua';
    case Ketum = 'ketum';
    case Bendahara = 'bendahara';

    public function label(): string
    {
        return match ($this) {
            self::Direktur => 'Direktur Pendidikan',
            self::Sekretariat => 'Sekretariat',
            self::Keuangan => 'Keuangan',
            self::Sekretaris => 'Sekretaris',
            self::WakilKetua => 'Wakil Ketua',
            self::Ketum => 'Ketua Umum',
            self::Bendahara => 'Bendahara',
        };
    }

    public function requiredRole(): UserRole
    {
        return match ($this) {
            self::Direktur => UserRole::Direktur,
            self::Sekretariat => UserRole::Sekretariat,
            self::Keuangan => UserRole::Keuangan,
            self::Sekretaris => UserRole::Sekretaris,
            self::WakilKetua => UserRole::Ketua1,
            self::Ketum => UserRole::Ketum,
            self::Bendahara => UserRole::Bendahara,
        };
    }

    /**
     * Get approval stages for Unit submitter
     *
     * @return array<int, self>
     */
    public static function unitFlow(): array
    {
        return [
            self::Direktur,
            self::Keuangan,
            self::Sekretaris,
            self::WakilKetua,
            self::Ketum,
            self::Bendahara,
        ];
    }

    /**
     * Get approval stages for Substansi submitter
     *
     * @return array<int, self>
     */
    public static function substansiFlow(): array
    {
        return [
            self::Sekretariat,
            self::Keuangan,
            self::Sekretaris,
            self::WakilKetua,
            self::Ketum,
            self::Bendahara,
        ];
    }

    /**
     * Get the next stage in the approval flow
     */
    public static function getNextStage(self $currentStage, bool $isUnit): ?self
    {
        $flow = $isUnit ? self::unitFlow() : self::substansiFlow();
        $currentIndex = array_search($currentStage, $flow, true);

        if ($currentIndex === false || $currentIndex === count($flow) - 1) {
            return null;
        }

        return $flow[$currentIndex + 1];
    }

    /**
     * Get the first stage based on submitter type
     */
    public static function getFirstStage(bool $isUnit): self
    {
        return $isUnit ? self::Direktur : self::Sekretariat;
    }

    /**
     * Get stage order in the flow
     */
    public function getOrder(bool $isUnit): int
    {
        $flow = $isUnit ? self::unitFlow() : self::substansiFlow();
        $index = array_search($this, $flow, true);

        return $index !== false ? $index + 1 : 0;
    }

    /**
     * Check if this is the final stage
     */
    public function isFinal(): bool
    {
        return $this === self::Bendahara;
    }
}
