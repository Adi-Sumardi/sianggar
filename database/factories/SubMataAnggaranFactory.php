<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubMataAnggaran>
 */
class SubMataAnggaranFactory extends Factory
{
    protected $model = SubMataAnggaran::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mata_anggaran_id' => MataAnggaran::factory(),
            'unit_id' => Unit::factory(),
            'kode' => (string) fake()->unique()->numberBetween(10, 99),
            'nama' => fake()->words(3, true),
        ];
    }

    /**
     * For specific mata anggaran.
     */
    public function forMataAnggaran(MataAnggaran $mataAnggaran): static
    {
        return $this->state(fn (array $attributes) => [
            'mata_anggaran_id' => $mataAnggaran->id,
            'unit_id' => $mataAnggaran->unit_id,
        ]);
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
}
