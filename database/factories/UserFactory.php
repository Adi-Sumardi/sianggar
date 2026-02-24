<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Admin->value,
            'unit_id' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Set the user's role.
     */
    public function withRole(UserRole $role): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => $role->value,
        ]);
    }

    /**
     * Create an admin user.
     */
    public function admin(): static
    {
        return $this->withRole(UserRole::Admin);
    }

    /**
     * Create a unit user (e.g., PG, SD, SMP).
     */
    public function unit(string $unitRole = 'sd'): static
    {
        $role = match ($unitRole) {
            'pg' => UserRole::PG,
            'ra' => UserRole::RA,
            'tk' => UserRole::TK,
            'sd' => UserRole::SD,
            'smp12' => UserRole::SMP12,
            'smp55' => UserRole::SMP55,
            'sma33' => UserRole::SMA33,
            default => UserRole::SD,
        };

        return $this->state(fn (array $attributes) => [
            'role' => $role->value,
            'unit_id' => Unit::factory(),
        ]);
    }

    /**
     * Create a Substansi user.
     */
    public function substansi(string $type = 'asrama'): static
    {
        $role = match ($type) {
            'asrama' => UserRole::Asrama,
            'laz' => UserRole::Laz,
            'litbang' => UserRole::Litbang,
            'stebank' => UserRole::Stebank,
            default => UserRole::Asrama,
        };

        return $this->withRole($role);
    }

    /**
     * Create a Staff Direktur user.
     */
    public function staffDirektur(): static
    {
        return $this->withRole(UserRole::StaffDirektur);
    }

    /**
     * Create a Staff Keuangan user.
     */
    public function staffKeuangan(): static
    {
        return $this->withRole(UserRole::StaffKeuangan);
    }

    /**
     * Create a Direktur user.
     */
    public function direktur(): static
    {
        return $this->withRole(UserRole::Direktur);
    }

    /**
     * Create a Kabag SDM Umum user.
     */
    public function kabagSdmUmum(): static
    {
        return $this->withRole(UserRole::KabagSdmUmum);
    }

    /**
     * Create a Sekretariat user.
     */
    public function sekretariat(): static
    {
        return $this->withRole(UserRole::Sekretariat);
    }

    /**
     * Create a Wakil Ketua user.
     */
    public function wakilKetua(): static
    {
        return $this->withRole(UserRole::Ketua1);
    }

    /**
     * Create a Sekretaris user.
     */
    public function sekretaris(): static
    {
        return $this->withRole(UserRole::Sekretaris);
    }

    /**
     * Create a Ketua Umum user.
     */
    public function ketum(): static
    {
        return $this->withRole(UserRole::Ketum);
    }

    /**
     * Create a Keuangan user.
     */
    public function keuangan(): static
    {
        return $this->withRole(UserRole::Keuangan);
    }

    /**
     * Create a Bendahara user.
     */
    public function bendahara(): static
    {
        return $this->withRole(UserRole::Bendahara);
    }

    /**
     * Create a Kasir user.
     */
    public function kasir(): static
    {
        return $this->withRole(UserRole::Kasir);
    }

    /**
     * Create a Payment handler user.
     */
    public function payment(): static
    {
        return $this->withRole(UserRole::Payment);
    }
}
