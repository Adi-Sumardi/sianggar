<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Indikator;
use App\Models\Proker;
use App\Models\Strategy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Proker>
 */
class ProkerFactory extends Factory
{
    protected $model = Proker::class;

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
            'kode' => 'P' . $suffix,
            'nama' => 'Proker ' . $suffix,
        ];
    }

    /**
     * For specific strategy.
     */
    public function forStrategy(Strategy $strategy): static
    {
        return $this->state(fn (array $attributes) => [
            'strategy_id' => $strategy->id,
        ]);
    }

    /**
     * For specific indikator.
     */
    public function forIndikator(Indikator $indikator): static
    {
        return $this->state(fn (array $attributes) => [
            'indikator_id' => $indikator->id,
            'strategy_id' => $indikator->strategy_id,
        ]);
    }

    /**
     * With complete hierarchy (Strategy -> Indikator -> Proker).
     */
    public function withHierarchy(): static
    {
        return $this->state(function (array $attributes) {
            $strategy = Strategy::factory()->create();
            $indikator = Indikator::factory()->forStrategy($strategy)->create();

            return [
                'strategy_id' => $strategy->id,
                'indikator_id' => $indikator->id,
            ];
        });
    }
}
