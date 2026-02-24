<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\MataAnggaran;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<MataAnggaran>
 */
class MataAnggaranFactory extends Factory
{
    protected $model = MataAnggaran::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit_id' => Unit::factory(),
            'kode' => fake()->unique()->numberBetween(100, 999) . '.' . fake()->numberBetween(10, 99),
            'nama' => fake()->words(3, true),
            'tahun' => AcademicYear::current(),
        ];
    }

    /**
     * For specific unit.
     */
    public function forUnit(Unit $unit): static
    {
        return $this->state(fn (array $attributes) => [
            'unit_id' => $unit->id,
        ]);
    }

    /**
     * For specific year.
     */
    public function forYear(string $year): static
    {
        return $this->state(fn (array $attributes) => [
            'tahun' => $year,
        ]);
    }

    /**
     * Pengeluaran type.
     */
    public function pengeluaran(): static
    {
        return $this->state(fn (array $attributes) => [
            'jenis' => 'pengeluaran',
        ]);
    }

    /**
     * Penerimaan type.
     */
    public function penerimaan(): static
    {
        return $this->state(fn (array $attributes) => [
            'jenis' => 'penerimaan',
        ]);
    }
}
