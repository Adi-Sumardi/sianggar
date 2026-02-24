<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Models\Approval;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Approval>
 */
class ApprovalFactory extends Factory
{
    protected $model = Approval::class;

    public function definition(): array
    {
        return [
            'approvable_type' => PengajuanAnggaran::class,
            'approvable_id' => PengajuanAnggaran::factory(),
            'stage' => ApprovalStage::StaffDirektur->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
            'approved_by' => null,
            'approved_at' => null,
            'notes' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ApprovalStatus::Pending->value,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ApprovalStatus::Approved->value,
            'approved_by' => User::factory(),
            'approved_at' => now(),
        ]);
    }

    public function revised(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ApprovalStatus::Revised->value,
            'approved_by' => User::factory(),
            'approved_at' => now(),
            'notes' => fake()->sentence(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ApprovalStatus::Rejected->value,
            'approved_by' => User::factory(),
            'approved_at' => now(),
            'notes' => fake()->sentence(),
        ]);
    }

    public function forStage(ApprovalStage $stage): static
    {
        return $this->state(fn (array $attributes) => [
            'stage' => $stage->value,
        ]);
    }

    public function staffDirektur(): static
    {
        return $this->forStage(ApprovalStage::StaffDirektur);
    }

    public function staffKeuangan(): static
    {
        return $this->forStage(ApprovalStage::StaffKeuangan);
    }

    public function direktur(): static
    {
        return $this->forStage(ApprovalStage::Direktur);
    }

    public function keuangan(): static
    {
        return $this->forStage(ApprovalStage::Keuangan);
    }

    public function bendahara(): static
    {
        return $this->forStage(ApprovalStage::Bendahara);
    }

    public function kasir(): static
    {
        return $this->forStage(ApprovalStage::Kasir);
    }

    public function payment(): static
    {
        return $this->forStage(ApprovalStage::Payment);
    }
}
