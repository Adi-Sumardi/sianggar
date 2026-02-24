<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DetailMataAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\PerubahanAnggaranItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerubahanAnggaranItem>
 */
class PerubahanAnggaranItemFactory extends Factory
{
    protected $model = PerubahanAnggaranItem::class;

    public function definition(): array
    {
        return [
            'perubahan_anggaran_id' => PerubahanAnggaran::factory(),
            'type' => 'geser',
            'source_detail_mata_anggaran_id' => DetailMataAnggaran::factory(),
            'target_detail_mata_anggaran_id' => DetailMataAnggaran::factory(),
            'amount' => fake()->numberBetween(100000, 10000000),
            'keterangan' => fake()->sentence(),
        ];
    }

    /**
     * Geser (shift/transfer) type.
     */
    public function geser(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'geser',
        ]);
    }

    /**
     * Tambah (addition) type - no source needed.
     */
    public function tambah(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'tambah',
            'source_detail_mata_anggaran_id' => null,
        ]);
    }

    /**
     * For specific perubahan anggaran.
     */
    public function forPerubahanAnggaran(PerubahanAnggaran $perubahan): static
    {
        return $this->state(fn (array $attributes) => [
            'perubahan_anggaran_id' => $perubahan->id,
        ]);
    }

    /**
     * With specific source.
     */
    public function fromSource(DetailMataAnggaran $source): static
    {
        return $this->state(fn (array $attributes) => [
            'source_detail_mata_anggaran_id' => $source->id,
        ]);
    }

    /**
     * With specific target.
     */
    public function toTarget(DetailMataAnggaran $target): static
    {
        return $this->state(fn (array $attributes) => [
            'target_detail_mata_anggaran_id' => $target->id,
        ]);
    }

    /**
     * With specific amount.
     */
    public function withAmount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'amount' => $amount,
        ]);
    }
}
