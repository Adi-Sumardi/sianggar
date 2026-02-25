<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\UserRole;
use App\Models\Lpj;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class LpjPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any LPJs.
     *
     * Any authenticated user can view the list.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the LPJ.
     *
     * Allowed for: admin, the pengajuan owner, same unit users, or approvers.
     */
    public function view(User $user, Lpj $lpj): bool
    {
        // Admin can view everything
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // The owner of the related pengajuan can view
        $pengajuan = $lpj->pengajuanAnggaran;

        if ($pengajuan && $user->id === $pengajuan->user_id) {
            return true;
        }

        // Same unit users can view
        if ($pengajuan && $user->unit_id !== null && $user->unit_id === $pengajuan->user?->unit_id) {
            return true;
        }

        // Approvers can view
        if ($user->role->isApprover()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create LPJs.
     *
     * Allowed for: admin or unit roles.
     */
    public function create(User $user): bool
    {
        return $user->role->canCreateLpj();
    }

    /**
     * Determine whether the user can update the LPJ.
     *
     * Allowed for: the owner of the related pengajuan when status is draft or revised.
     */
    public function update(User $user, Lpj $lpj): bool
    {
        // Admin can always update
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        $pengajuan = $lpj->pengajuanAnggaran;

        // Owner can update only when status is draft or revised
        if ($pengajuan && $user->id === $pengajuan->user_id) {
            return in_array($lpj->proses, [
                LpjStatus::Draft,
                LpjStatus::Revised,
            ], true);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the LPJ.
     *
     * Allowed for: owner when status is draft, or admin.
     */
    public function delete(User $user, Lpj $lpj): bool
    {
        // Admin can always delete
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        $pengajuan = $lpj->pengajuanAnggaran;

        // Owner can delete only when status is draft
        if ($pengajuan && $user->id === $pengajuan->user_id && $lpj->proses === LpjStatus::Draft) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can approve the LPJ.
     *
     * The user's role must match the required role for the current approval stage.
     */
    public function approve(User $user, Lpj $lpj): bool
    {
        // Admin can always approve
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // LPJ must be in a reviewable state
        if (! in_array($lpj->proses, [
            LpjStatus::Submitted,
            LpjStatus::Validated,
            LpjStatus::ApprovedByMiddle,
        ], true)) {
            return false;
        }

        // Must have a current approval stage
        if (! $lpj->current_approval_stage) {
            return false;
        }

        // Check pending approval matches the current stage
        $pendingApproval = $lpj->approvals()
            ->where('status', 'pending')
            ->where('stage', $lpj->current_approval_stage->value)
            ->first();

        if (! $pendingApproval) {
            return false;
        }

        // Resolve stage as LpjApprovalStage for role matching
        $stage = LpjApprovalStage::tryFrom($lpj->current_approval_stage->value);

        if (! $stage) {
            return false;
        }

        return $user->role === $stage->requiredRole();
    }

    /**
     * Determine whether the user can submit the LPJ.
     *
     * Allowed for: owner when status is draft or revised.
     */
    public function submit(User $user, Lpj $lpj): bool
    {
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        $pengajuan = $lpj->pengajuanAnggaran;

        if (! $pengajuan || $user->id !== $pengajuan->user_id) {
            return false;
        }

        return in_array($lpj->proses, [
            LpjStatus::Draft,
            LpjStatus::Revised,
        ], true);
    }
}
