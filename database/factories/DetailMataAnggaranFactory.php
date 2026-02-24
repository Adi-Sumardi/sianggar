<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<DetailMataAnggaran>
 */
class DetailMataAnggaranFactory extends Factory
{
    protected $model = DetailMataAnggaran::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $anggaran = fake()->numberBetween(1000000, 50000000);
        $suffix = fake()->unique()->numberBetween(1, 99999);

        return [
            'mata_anggaran_id' => MataAnggaran::factory(),
            'sub_mata_anggaran_id' => SubMataAnggaran::factory(),
            'unit_id' => Unit::factory(),
            'pkt_id' => null,
            'tahun' => AcademicYear::current(),
            'kode' => 'D' . $suffix,
            'nama' => 'Detail ' . $suffix,
            'volume' => fake()->numberBetween(1, 10),
            'satuan' => fake()->randomElement(['paket', 'unit', 'orang', 'kegiatan']),
            'harga_satuan' => $anggaran,
            'jumlah' => $anggaran,
            'anggaran_awal' => $anggaran,
            'balance' => $anggaran,
            'saldo_dipakai' => 0,
            'realisasi_year' => 0,
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
     * For specific sub mata anggaran.
     */
    public function forSubMataAnggaran(SubMataAnggaran $subMataAnggaran): static
    {
        return $this->state(fn (array $attributes) => [
            'sub_mata_anggaran_id' => $subMataAnggaran->id,
            'mata_anggaran_id' => $subMataAnggaran->mata_anggaran_id,
            'unit_id' => $subMataAnggaran->unit_id,
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
     * For specific year.
     */
    public function forYear(string $year): static
    {
        return $this->state(fn (array $attributes) => [
            'tahun' => $year,
        ]);
    }

    /**
     * With specific budget amount.
     */
    public function withBudget(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'anggaran_awal' => $amount,
            'balance' => $amount,
            'harga_satuan' => $amount,
            'jumlah' => $amount,
        ]);
    }

    /**
     * With partial usage.
     */
    public function withUsage(float $usedAmount): static
    {
        return $this->state(function (array $attributes) use ($usedAmount) {
            $anggaran = $attributes['anggaran_awal'] ?? 10000000;

            return [
                'saldo_dipakai' => $usedAmount,
                'balance' => $anggaran - $usedAmount,
            ];
        });
    }

    /**
     * With realization.
     */
    public function withRealization(float $realisasi): static
    {
        return $this->state(fn (array $attributes) => [
            'realisasi_year' => $realisasi,
        ]);
    }
}
