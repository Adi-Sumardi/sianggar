<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DetailMataAnggaran;
use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\MataAnggaran;
use App\Models\Pkt;
use App\Models\Proker;
use App\Models\Strategy;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<Pkt>
 */
class PktFactory extends Factory
{
    protected $model = Pkt::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mata_anggaran_id' => MataAnggaran::factory(),
            'sub_mata_anggaran_id' => null,
            'detail_mata_anggaran_id' => null,
            'unit_id' => null,
            'tahun' => AcademicYear::current(),
            'unit' => fake()->randomElement(['SD', 'SMP', 'SMA', 'SMK']),
            'deskripsi_kegiatan' => fake()->sentence(),
            'tujuan_kegiatan' => fake()->paragraph(),
            'saldo_anggaran' => fake()->numberBetween(1000000, 50000000),
            'volume' => fake()->numberBetween(1, 100),
            'satuan' => fake()->randomElement(['paket', 'unit', 'orang', 'kegiatan']),
            'created_by' => User::factory(),
            'status' => 'draft',
            'catatan' => null,
        ];
    }

    /**
     * Configure the factory to create proper hierarchy.
     */
    public function configure(): static
    {
        return $this->afterMaking(function (Pkt $pkt) {
            // Create consistent hierarchy
            if (! $pkt->kegiatan_id) {
                $strategy = Strategy::factory()->create();
                $indikator = Indikator::factory()->create(['strategy_id' => $strategy->id]);
                $proker = Proker::factory()->create([
                    'strategy_id' => $strategy->id,
                    'indikator_id' => $indikator->id,
                ]);
                $kegiatan = Kegiatan::factory()->create([
                    'strategy_id' => $strategy->id,
                    'indikator_id' => $indikator->id,
                    'proker_id' => $proker->id,
                ]);

                $pkt->strategy_id = $strategy->id;
                $pkt->indikator_id = $indikator->id;
                $pkt->proker_id = $proker->id;
                $pkt->kegiatan_id = $kegiatan->id;
            }
        });
    }

    /**
     * PKT is draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    /**
     * PKT is submitted.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'submitted',
        ]);
    }

    /**
     * PKT is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * For specific unit.
     */
    public function forUnit(Unit $unit): static
    {
        return $this->state(fn (array $attributes) => [
            'unit_id' => $unit->id,
            'unit' => $unit->nama,
        ]);
    }

    /**
     * With sub mata anggaran.
     */
    public function withSubMataAnggaran(): static
    {
        return $this->state(fn (array $attributes) => [
            'sub_mata_anggaran_id' => SubMataAnggaran::factory(),
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
     * With specific budget.
     */
    public function withBudget(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'saldo_anggaran' => $amount,
        ]);
    }

    /**
     * Created by specific user.
     */
    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
            'unit_id' => $user->unit_id,
        ]);
    }

    /**
     * With mata anggaran.
     */
    public function withMataAnggaran(MataAnggaran $mataAnggaran, ?SubMataAnggaran $subMataAnggaran = null): static
    {
        return $this->state(fn (array $attributes) => [
            'mata_anggaran_id' => $mataAnggaran->id,
            'sub_mata_anggaran_id' => $subMataAnggaran?->id,
        ]);
    }

    /**
     * With detail mata anggaran.
     */
    public function withDetailMataAnggaran(DetailMataAnggaran $detail): static
    {
        return $this->state(fn (array $attributes) => [
            'detail_mata_anggaran_id' => $detail->id,
            'mata_anggaran_id' => $detail->mata_anggaran_id,
            'sub_mata_anggaran_id' => $detail->sub_mata_anggaran_id,
            'unit_id' => $detail->unit_id,
        ]);
    }

    /**
     * With specific planning hierarchy.
     */
    public function withPlanning(Strategy $strategy, Indikator $indikator, Proker $proker, Kegiatan $kegiatan): static
    {
        return $this->state(fn (array $attributes) => [
            'strategy_id' => $strategy->id,
            'indikator_id' => $indikator->id,
            'proker_id' => $proker->id,
            'kegiatan_id' => $kegiatan->id,
        ]);
    }
}
