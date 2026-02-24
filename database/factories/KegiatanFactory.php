<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\Proker;
use App\Models\Strategy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Kegiatan>
 */
class KegiatanFactory extends Factory
{
    protected $model = Kegiatan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $suffix = fake()->unique()->numberBetween(1, 99999);

        return [
            'strategy_id' => Strategy::factory(),
            'indikator_id' => Indikator::factory(),
            'proker_id' => Proker::factory(),
            'kode' => 'K' . $suffix,
            'nama' => 'Kegiatan ' . $suffix,
        ];
    }

    /**
     * For specific proker.
     */
    public function forProker(Proker $proker): static
    {
        return $this->state(fn (array $attributes) => [
            'proker_id' => $proker->id,
            'strategy_id' => $proker->strategy_id,
            'indikator_id' => $proker->indikator_id,
        ]);
    }

    /**
     * With complete hierarchy (Strategy -> Indikator -> Proker -> Kegiatan).
     */
    public function withHierarchy(): static
    {
        return $this->state(function (array $attributes) {
            $strategy = Strategy::factory()->create();
            $indikator = Indikator::factory()->forStrategy($strategy)->create();
            $proker = Proker::factory()->create([
                'strategy_id' => $strategy->id,
                'indikator_id' => $indikator->id,
            ]);

            return [
                'strategy_id' => $strategy->id,
                'indikator_id' => $indikator->id,
                'proker_id' => $proker->id,
            ];
        });
    }
}
