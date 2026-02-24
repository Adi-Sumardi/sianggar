<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApprovalStage;
use App\Enums\PerubahanAnggaranStatus;
use App\Models\PerubahanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerubahanAnggaran>
 */
class PerubahanAnggaranFactory extends Factory
{
    protected $model = PerubahanAnggaran::class;

    public function definition(): array
    {
        $suffix = fake()->unique()->numberBetween(1, 99999);
        $month = now()->format('m');
        $year = now()->format('Y');

        return [
            'nomor_perubahan' => sprintf('PA-%03d/%s/%s', $suffix, $month, $year),
            'user_id' => User::factory(),
            'unit_id' => Unit::factory(),
            'tahun' => $year,
            'perihal' => fake()->sentence(),
            'alasan' => fake()->paragraph(),
            'submitter_type' => null,
            'status' => PerubahanAnggaranStatus::Draft->value,
            'current_approval_stage' => null,
            'total_amount' => 0,
            'processed_at' => null,
            'processed_by' => null,
        ];
    }

    /**
     * Draft status.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::Draft->value,
            'submitter_type' => null,
            'current_approval_stage' => null,
        ]);
    }

    /**
     * Submitted status for unit submitter.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::Submitted->value,
            'submitter_type' => 'unit',
            'current_approval_stage' => ApprovalStage::Direktur->value,
        ]);
    }

    /**
     * Submitted status for substansi submitter.
     */
    public function submittedSubstansi(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::Submitted->value,
            'submitter_type' => 'substansi',
            'current_approval_stage' => ApprovalStage::KabagSekretariat->value,
        ]);
    }

    /**
     * Revision required status.
     */
    public function revisionRequired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::RevisionRequired->value,
            'submitter_type' => 'unit',
            'current_approval_stage' => null,
        ]);
    }

    /**
     * Approved level 1 (by Direktur/Kabag).
     */
    public function approvedLevel1(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::ApprovedLevel1->value,
            'submitter_type' => 'unit',
            'current_approval_stage' => ApprovalStage::WakilKetua->value,
        ]);
    }

    /**
     * Rejected status.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::Rejected->value,
            'submitter_type' => 'unit',
            'current_approval_stage' => null,
        ]);
    }

    /**
     * Processed status (final - budget transfer executed).
     */
    public function processed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PerubahanAnggaranStatus::Processed->value,
            'submitter_type' => 'unit',
            'current_approval_stage' => null,
            'processed_at' => now(),
            'processed_by' => User::factory(),
        ]);
    }

    /**
     * For specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
            'unit_id' => $user->unit_id,
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
     * With total amount.
     */
    public function withTotalAmount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'total_amount' => $amount,
        ]);
    }

    /**
     * Unit submitter type.
     */
    public function unitSubmitter(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitter_type' => 'unit',
        ]);
    }

    /**
     * Substansi submitter type.
     */
    public function substansiSubmitter(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitter_type' => 'substansi',
        ]);
    }
}
