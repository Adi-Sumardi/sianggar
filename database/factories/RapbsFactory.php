<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Models\Rapbs;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<Rapbs>
 */
class RapbsFactory extends Factory
{
    protected $model = Rapbs::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit_id' => Unit::factory(),
            'tahun' => AcademicYear::current(),
            'total_anggaran' => fake()->numberBetween(100000000, 1000000000),
            'status' => RapbsStatus::Draft,
            'current_approval_stage' => null,
            'submitted_by' => null,
            'submitted_at' => null,
            'approved_by' => null,
            'approved_at' => null,
            'keterangan' => fake()->sentence(),
        ];
    }

    /**
     * RAPBS is draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Draft,
            'current_approval_stage' => null,
        ]);
    }

    /**
     * RAPBS is submitted.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Submitted,
            'current_approval_stage' => RapbsApprovalStage::Direktur,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now(),
        ]);
    }

    /**
     * RAPBS is verified.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Verified,
            'current_approval_stage' => RapbsApprovalStage::Keuangan,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now(),
        ]);
    }

    /**
     * RAPBS is in review.
     */
    public function inReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::InReview,
            'current_approval_stage' => RapbsApprovalStage::Sekretaris,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now(),
        ]);
    }

    /**
     * RAPBS is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Approved,
            'current_approval_stage' => null,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now()->subDays(7),
            'approved_by' => User::factory(),
            'approved_at' => now(),
        ]);
    }

    /**
     * RAPBS has APBS generated.
     */
    public function apbsGenerated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::ApbsGenerated,
            'current_approval_stage' => null,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now()->subDays(14),
            'approved_by' => User::factory(),
            'approved_at' => now()->subDays(7),
        ]);
    }

    /**
     * RAPBS is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Active,
            'current_approval_stage' => null,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now()->subDays(30),
            'approved_by' => User::factory(),
            'approved_at' => now()->subDays(14),
        ]);
    }

    /**
     * RAPBS is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RapbsStatus::Rejected,
            'current_approval_stage' => null,
            'submitted_by' => User::factory()->unit(),
            'submitted_at' => now(),
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
     * With specific total budget.
     */
    public function withTotal(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'total_anggaran' => $amount,
        ]);
    }

    /**
     * Submitted by specific user.
     */
    public function submittedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'submitted_by' => $user->id,
            'submitted_at' => now(),
        ]);
    }

    /**
     * At specific approval stage.
     */
    public function atStage(RapbsApprovalStage $stage): static
    {
        return $this->state(fn (array $attributes) => [
            'current_approval_stage' => $stage,
        ]);
    }
}
