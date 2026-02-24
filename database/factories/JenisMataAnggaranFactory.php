<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\JenisMataAnggaran;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JenisMataAnggaran>
 */
class JenisMataAnggaranFactory extends Factory
{
    protected $model = JenisMataAnggaran::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kode' => fake()->unique()->regexify('[A-Z]{2}[0-9]{2}'),
            'nama' => fake()->words(3, true),
            'keterangan' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }

    /**
     * Inactive state.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Pengeluaran type.
     */
    public function pengeluaran(): static
    {
        return $this->state(fn (array $attributes) => [
            'kode' => 'PG' . fake()->unique()->numberBetween(1, 99),
            'nama' => 'Pengeluaran ' . fake()->words(2, true),
        ]);
    }

    /**
     * Penerimaan type.
     */
    public function penerimaan(): static
    {
        return $this->state(fn (array $attributes) => [
            'kode' => 'PN' . fake()->unique()->numberBetween(1, 99),
            'nama' => 'Penerimaan ' . fake()->words(2, true),
        ]);
    }
}
