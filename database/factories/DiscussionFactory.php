<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Discussion;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discussion>
 */
class DiscussionFactory extends Factory
{
    protected $model = Discussion::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pengajuan_anggaran_id' => PengajuanAnggaran::factory(),
            'status' => 'open',
            'opened_by' => User::factory(),
            'closed_by' => null,
            'opened_at' => now(),
            'closed_at' => null,
        ];
    }

    /**
     * Discussion is open.
     */
    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'open',
            'closed_by' => null,
            'closed_at' => null,
        ]);
    }

    /**
     * Discussion is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
            'closed_by' => User::factory(),
            'closed_at' => now(),
        ]);
    }

    /**
     * Configure the model factory with a specific opener.
     */
    public function openedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'opened_by' => $user->id,
        ]);
    }

    /**
     * Configure the model factory with a specific closer.
     */
    public function closedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
            'closed_by' => $user->id,
            'closed_at' => now(),
        ]);
    }

    /**
     * Configure with specific pengajuan.
     */
    public function forPengajuan(PengajuanAnggaran $pengajuan): static
    {
        return $this->state(fn (array $attributes) => [
            'pengajuan_anggaran_id' => $pengajuan->id,
        ]);
    }
}
