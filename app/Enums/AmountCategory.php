<?php

declare(strict_types=1);

namespace App\Enums;

enum AmountCategory: string
{
    case Low = 'low';
    case High = 'high';

    public const THRESHOLD = 10_000_000;

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Rendah (< 10 Juta)',
            self::High => 'Tinggi (≥ 10 Juta)',
        };
    }

    public static function fromAmount(float $amount): self
    {
        return $amount >= self::THRESHOLD ? self::High : self::Low;
    }
}
