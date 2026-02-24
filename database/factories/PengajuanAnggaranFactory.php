<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AmountCategory;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<PengajuanAnggaran>
 */
class PengajuanAnggaranFactory extends Factory
{
    protected $model = PengajuanAnggaran::class;

    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 1000000, 50000000);

        return [
            'user_id' => User::factory(),
            'unit_id' => Unit::factory(),
            'tahun' => AcademicYear::current(),
            'nomor_pengajuan' => sprintf('PG-%s-%04d', now()->format('Ym'), fake()->unique()->randomNumber(4)),
            'perihal' => fake()->sentence(5),
            'nama_pengajuan' => fake()->words(3, true),
            'no_surat' => sprintf('%03d/SK/%s', fake()->randomNumber(3), now()->format('Y')),
            'tempat' => fake()->city(),
            'waktu_kegiatan' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'unit' => fake()->randomElement(['PG', 'SD', 'SMP', 'SMA']),
            'jumlah_pengajuan_total' => $amount,
            'status_proses' => ProposalStatus::Draft->value,
            'current_approval_stage' => null,
            'amount_category' => AmountCategory::fromAmount($amount)->value,
            'submitter_type' => 'unit',
            'need_lpj' => false,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::Draft->value,
        ]);
    }

    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::Submitted->value,
            'current_approval_stage' => 'staff-direktur',
        ]);
    }

    public function lowAmount(): static
    {
        $amount = fake()->randomFloat(2, 1000000, 9000000);

        return $this->state(fn (array $attributes) => [
            'jumlah_pengajuan_total' => $amount,
            'amount_category' => AmountCategory::Low->value,
        ]);
    }

    public function highAmount(): static
    {
        $amount = fake()->randomFloat(2, 15000000, 100000000);

        return $this->state(fn (array $attributes) => [
            'jumlah_pengajuan_total' => $amount,
            'amount_category' => AmountCategory::High->value,
        ]);
    }

    public function withReferenceType(ReferenceType $type): static
    {
        return $this->state(fn (array $attributes) => [
            'reference_type' => $type->value,
        ]);
    }

    public function fromUnit(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitter_type' => 'unit',
        ]);
    }

    public function fromSubstansi(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitter_type' => 'substansi',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::FinalApproved->value,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::Paid->value,
            'status_payment' => 'paid',
            'paid_at' => now(),
            'no_voucher' => sprintf('%03d/%s/%s', fake()->randomNumber(3), now()->format('m'), now()->format('Y')),
        ]);
    }

    public function needsLpj(): static
    {
        return $this->state(fn (array $attributes) => [
            'need_lpj' => true,
        ]);
    }

    public function revisionRequired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::RevisionRequired->value,
            'status_revisi' => 'revisi',
            'date_revisi' => now()->toDateString(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_proses' => ProposalStatus::Rejected->value,
        ]);
    }
}
