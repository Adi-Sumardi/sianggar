<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'no_hp',
        'password',
        'role',
        'unit_id',
    ];

    /**
     * Route notifications for SaungWA channel.
     * Normalizes Indonesian phone numbers to international format (628xxx).
     */
    public function routeNotificationForSaungWa(): ?string
    {
        if (empty($this->no_hp)) {
            return null;
        }

        $phone = preg_replace('/\D/', '', $this->no_hp);

        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (! str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    // -------------------------------------------------------------------------
    // Auto-sync Spatie role when the role column changes
    // -------------------------------------------------------------------------

    protected static function booted(): void
    {
        static::created(function (User $user) {
            if ($user->role !== null) {
                $user->syncRoles([$user->role->value]);
            }
        });

        static::updated(function (User $user) {
            if ($user->wasChanged('role') && $user->role !== null) {
                $user->syncRoles([$user->role->value]);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function pengajuanAnggarans(): HasMany
    {
        return $this->hasMany(PengajuanAnggaran::class);
    }

    public function emails(): HasMany
    {
        return $this->hasMany(Email::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class, 'approved_by');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    public function hasEnumRole(UserRole ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByRole(Builder $query, UserRole $role): Builder
    {
        return $query->where('role', $role->value);
    }
}
