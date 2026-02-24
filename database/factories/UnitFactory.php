<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Unit>
 */
class UnitFactory extends Factory
{
    protected $model = Unit::class;

    public function definition(): array
    {
        $suffix = fake()->unique()->numberBetween(1, 99999);

        return [
            'nama' => 'Unit ' . $suffix,
            'kode' => 'unit-' . $suffix,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    public function pg(): static
    {
        return $this->state(function (array $attributes) {
            $suffix = fake()->unique()->numberBetween(1, 99999);
            return [
                'nama' => 'PG ' . $suffix,
                'kode' => 'pg-' . $suffix,
            ];
        });
    }

    public function sd(): static
    {
        return $this->state(function (array $attributes) {
            $suffix = fake()->unique()->numberBetween(1, 99999);
            return [
                'nama' => 'SD ' . $suffix,
                'kode' => 'sd-' . $suffix,
            ];
        });
    }

    public function smp(): static
    {
        return $this->state(function (array $attributes) {
            $suffix = fake()->unique()->numberBetween(1, 99999);
            return [
                'nama' => 'SMP ' . $suffix,
                'kode' => 'smp-' . $suffix,
            ];
        });
    }
}
