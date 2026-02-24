<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\EmailStatus;
use App\Models\Email;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Email>
 */
class EmailFactory extends Factory
{
    protected $model = Email::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name_surat' => fake()->sentence(3),
            'no_surat' => 'SI-' . fake()->unique()->numberBetween(1000, 9999) . '/' . date('Y'),
            'isi_surat' => fake()->paragraphs(3, true),
            'tgl_surat' => fake()->dateTimeBetween('-30 days', 'now'),
            'status' => EmailStatus::Draft,
            'ditujukan' => fake()->name(),
            'status_arsip' => false,
            'status_revisi' => false,
        ];
    }

    /**
     * Email is draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailStatus::Draft,
        ]);
    }

    /**
     * Email is sent.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailStatus::Sent,
        ]);
    }

    /**
     * Email is in process.
     */
    public function inProcess(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailStatus::InProcess,
        ]);
    }

    /**
     * Email is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailStatus::Approved,
        ]);
    }

    /**
     * Email is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailStatus::Archived,
            'status_arsip' => true,
        ]);
    }

    /**
     * Email needs revision.
     */
    public function needsRevision(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_revisi' => true,
        ]);
    }
}
