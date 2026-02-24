<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Email;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EmailPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any emails.
     *
     * Any authenticated user can view the list.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the email.
     *
     * Allowed for: admin, sender, or recipient role match.
     */
    public function view(User $user, Email $email): bool
    {
        // Admin can view everything
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // Sender can always view their own email
        if ($user->id === $email->user_id) {
            return true;
        }

        // Check if the user's role matches the recipient (ditujukan field)
        if ($email->ditujukan !== null) {
            $ditujukanRole = UserRole::tryFrom($email->ditujukan);

            if ($ditujukanRole !== null && $user->role === $ditujukanRole) {
                return true;
            }

            // Also check if ditujukan matches the user's role label or value
            if (mb_strtolower($email->ditujukan) === $user->role->value) {
                return true;
            }
        }

        // Check if user is in the recipients list (for multiple recipients)
        if ($email->relationLoaded('recipients') || $email->recipients()->exists()) {
            $isRecipient = $email->recipients()
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('role', $user->role->value);
                })
                ->exists();

            if ($isRecipient) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine whether the user can create emails.
     *
     * Any authenticated user can create.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the email.
     *
     * Allowed for: sender only (when in draft status).
     */
    public function update(User $user, Email $email): bool
    {
        // Admin can always update
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        return $user->id === $email->user_id;
    }

    /**
     * Determine whether the user can delete the email.
     *
     * Allowed for: sender only.
     */
    public function delete(User $user, Email $email): bool
    {
        // Admin can always delete
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        return $user->id === $email->user_id;
    }
}
