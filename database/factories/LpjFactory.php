<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Helpers\AcademicYear;

/**
 * @extends Factory<Lpj>
 */
class LpjFactory extends Factory
{
    protected $model = Lpj::class;

    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 1000000, 50000000);

        return [
            'pengajuan_anggaran_id' => PengajuanAnggaran::factory(),
            'unit' => fake()->randomElement(['PG', 'SD', 'SMP', 'SMA']),
            'no_surat' => sprintf('%03d/LPJ/%s', fake()->randomNumber(3), now()->format('Y')),
            'mata_anggaran' => fake()->words(3, true),
            'perihal' => fake()->sentence(5),
            'no_mata_anggaran' => sprintf('MA-%04d', fake()->randomNumber(4)),
            'jumlah_pengajuan_total' => $amount,
            'tgl_kegiatan' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'input_realisasi' => $amount * 0.95, // 95% realisasi
            'deskripsi_singkat' => fake()->paragraph(),
            'proses' => LpjStatus::Draft->value,
            'current_approval_stage' => null,
            'tahun' => AcademicYear::current(),
            'ditujukan' => 'Ketua Yayasan',
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Draft->value,
            'current_approval_stage' => null,
        ]);
    }

    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Submitted->value,
            'current_approval_stage' => LpjApprovalStage::StaffKeuangan->value,
        ]);
    }

    public function validated(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Validated->value,
            'current_approval_stage' => LpjApprovalStage::Direktur->value,
            'reference_type' => ReferenceType::Education->value,
            'validated_at' => now(),
        ]);
    }

    public function approvedByMiddle(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::ApprovedByMiddle->value,
            'current_approval_stage' => LpjApprovalStage::Keuangan->value,
            'reference_type' => ReferenceType::Education->value,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Approved->value,
            'current_approval_stage' => null,
            'reference_type' => ReferenceType::Education->value,
        ]);
    }

    public function revised(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Revised->value,
            'status_revisi' => 'revisi',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'proses' => LpjStatus::Rejected->value,
            'current_approval_stage' => null,
        ]);
    }

    public function withReferenceType(ReferenceType $type): static
    {
        return $this->state(fn (array $attributes) => [
            'reference_type' => $type->value,
        ]);
    }

    public function education(): static
    {
        return $this->withReferenceType(ReferenceType::Education);
    }

    public function hrGeneral(): static
    {
        return $this->withReferenceType(ReferenceType::HrGeneral);
    }

    public function secretariat(): static
    {
        return $this->withReferenceType(ReferenceType::Secretariat);
    }
}
