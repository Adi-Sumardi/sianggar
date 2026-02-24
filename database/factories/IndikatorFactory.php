<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Indikator;
use App\Models\Strategy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Indikator>
 */
class IndikatorFactory extends Factory
{
    protected $model = Indikator::class;

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
            'kode' => 'I' . $suffix,
            'nama' => 'Indikator ' . $suffix,
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
}
