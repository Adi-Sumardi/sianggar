<?php

declare(strict_types=1);

use App\Enums\AmountCategory;

describe('AmountCategory Enum', function () {
    it('has correct values', function () {
        expect(AmountCategory::Low->value)->toBe('low');
        expect(AmountCategory::High->value)->toBe('high');
    });

    it('has correct labels', function () {
        expect(AmountCategory::Low->label())->toBe('Rendah (< 10 Juta)');
        expect(AmountCategory::High->label())->toBe('Tinggi (≥ 10 Juta)');
    });

    it('has correct threshold constant', function () {
        expect(AmountCategory::THRESHOLD)->toBe(10_000_000);
    });

    describe('fromAmount', function () {
        it('returns Low for amounts below threshold', function () {
            expect(AmountCategory::fromAmount(0))->toBe(AmountCategory::Low);
            expect(AmountCategory::fromAmount(1_000_000))->toBe(AmountCategory::Low);
            expect(AmountCategory::fromAmount(5_000_000))->toBe(AmountCategory::Low);
            expect(AmountCategory::fromAmount(9_999_999))->toBe(AmountCategory::Low);
            expect(AmountCategory::fromAmount(9_999_999.99))->toBe(AmountCategory::Low);
        });

        it('returns High for amounts at or above threshold', function () {
            expect(AmountCategory::fromAmount(10_000_000))->toBe(AmountCategory::High);
            expect(AmountCategory::fromAmount(10_000_001))->toBe(AmountCategory::High);
            expect(AmountCategory::fromAmount(15_000_000))->toBe(AmountCategory::High);
            expect(AmountCategory::fromAmount(50_000_000))->toBe(AmountCategory::High);
            expect(AmountCategory::fromAmount(100_000_000))->toBe(AmountCategory::High);
        });

        it('handles edge cases correctly', function () {
            // Exactly at threshold
            expect(AmountCategory::fromAmount(10_000_000.00))->toBe(AmountCategory::High);

            // Just below threshold
            expect(AmountCategory::fromAmount(9_999_999.99))->toBe(AmountCategory::Low);
        });
    });
});
