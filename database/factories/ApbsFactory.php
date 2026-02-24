<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Apbs;
use App\Models\Rapbs;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<Apbs>
 */
class ApbsFactory extends Factory
{
    protected $model = Apbs::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalAnggaran = fake()->numberBetween(100000000, 1000000000);
        $totalRealisasi = fake()->numberBetween(0, (int) ($totalAnggaran * 0.8));
        $sisaAnggaran = $totalAnggaran - $totalRealisasi;

        return [
            'unit_id' => Unit::factory(),
            'rapbs_id' => Rapbs::factory()->approved(),
            'tahun' => AcademicYear::current(),
            'total_anggaran' => $totalAnggaran,
            'total_realisasi' => $totalRealisasi,
            'sisa_anggaran' => $sisaAnggaran,
            'nomor_dokumen' => 'APBS-' . fake()->unique()->numberBetween(1000, 9999) . '/' . date('Y'),
            'tanggal_pengesahan' => fake()->dateTimeBetween('-90 days', 'now'),
            'status' => 'active',
            'keterangan' => fake()->sentence(),
            'ttd_kepala_sekolah' => null,
            'ttd_bendahara' => null,
            'ttd_ketua_umum' => null,
        ];
    }

    /**
     * APBS is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * APBS is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
        ]);
    }

    /**
     * APBS is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'total_realisasi' => 0,
            'sisa_anggaran' => $attributes['total_anggaran'] ?? 100000000,
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

    /**
     * From specific RAPBS.
     */
    public function fromRapbs(Rapbs $rapbs): static
    {
        return $this->state(fn (array $attributes) => [
            'rapbs_id' => $rapbs->id,
            'unit_id' => $rapbs->unit_id,
            'tahun' => $rapbs->tahun,
            'total_anggaran' => $rapbs->total_anggaran,
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
    public function withBudget(float $total, float $realisasi = 0): static
    {
        return $this->state(fn (array $attributes) => [
            'total_anggaran' => $total,
            'total_realisasi' => $realisasi,
            'sisa_anggaran' => $total - $realisasi,
        ]);
    }

    /**
     * With full realization.
     */
    public function fullyRealized(): static
    {
        return $this->state(function (array $attributes) {
            $total = $attributes['total_anggaran'] ?? 100000000;

            return [
                'total_realisasi' => $total,
                'sisa_anggaran' => 0,
            ];
        });
    }

    /**
     * With no realization.
     */
    public function noRealization(): static
    {
        return $this->state(function (array $attributes) {
            $total = $attributes['total_anggaran'] ?? 100000000;

            return [
                'total_realisasi' => 0,
                'sisa_anggaran' => $total,
            ];
        });
    }

    /**
     * With partial realization percentage.
     */
    public function withRealizationPercent(float $percent): static
    {
        return $this->state(function (array $attributes) use ($percent) {
            $total = $attributes['total_anggaran'] ?? 100000000;
            $realisasi = $total * ($percent / 100);

            return [
                'total_realisasi' => $realisasi,
                'sisa_anggaran' => $total - $realisasi,
            ];
        });
    }

    /**
     * With signatures.
     */
    public function signed(): static
    {
        return $this->state(fn (array $attributes) => [
            'ttd_kepala_sekolah' => 'signed',
            'ttd_bendahara' => 'signed',
            'ttd_ketua_umum' => 'signed',
        ]);
    }
}
