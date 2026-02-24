<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\ApprovalStage;
use App\Enums\ProposalStatus;
use App\Enums\UserRole;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PengajuanPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any proposals.
     *
     * Any authenticated user can view the list.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the proposal.
     *
     * Allowed for: admin, same unit users, the proposal owner, or approvers.
     */
    public function view(User $user, PengajuanAnggaran $pengajuan): bool
    {
        // Admin can view everything
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // Owner can always view their own proposal
        if ($user->id === $pengajuan->user_id) {
            return true;
        }

        // Users in the same unit can view
        if ($user->unit_id !== null && $user->unit_id === $pengajuan->user?->unit_id) {
            return true;
        }

        // Approvers can view proposals that are in review or submitted
        if ($user->role->isApprover()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create proposals.
     *
     * Allowed for: admin or unit roles.
     */
    public function create(User $user): bool
    {
        return $user->role->canCreateProposal();
    }

    /**
     * Determine whether the user can update the proposal.
     *
     * Allowed for: the owner when the proposal status is draft or revised.
     */
    public function update(User $user, PengajuanAnggaran $pengajuan): bool
    {
        // Admin can always update
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // Owner can update only when status is draft, revised, or revision-required
        if ($user->id === $pengajuan->user_id) {
            return in_array($pengajuan->status_proses, [
                ProposalStatus::Draft,
                ProposalStatus::Revised,
                ProposalStatus::RevisionRequired,
            ], true);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the proposal.
     *
     * Allowed for: owner when status is draft, or admin.
     */
    public function delete(User $user, PengajuanAnggaran $pengajuan): bool
    {
        // Admin can always delete
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // Owner can delete only when status is draft
        if ($user->id === $pengajuan->user_id && $pengajuan->status_proses === ProposalStatus::Draft) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can approve the proposal.
     *
     * The user's role must match the required role for the current approval stage.
     */
    public function approve(User $user, PengajuanAnggaran $pengajuan): bool
    {
        // Admin can always approve
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        // Proposal must be in a reviewable state (any status in the approval pipeline)
        if (in_array($pengajuan->status_proses, [
            ProposalStatus::Draft,
            ProposalStatus::RevisionRequired,
            ProposalStatus::Rejected,
            ProposalStatus::Paid,
        ], true)) {
            return false;
        }

        // Check if the user's role matches the current approval stage
        $currentStage = $pengajuan->current_approval_stage;

        if ($currentStage === null) {
            return false;
        }

        // Try to resolve the current stage as an ApprovalStage enum
        $stage = ApprovalStage::tryFrom($currentStage);

        if ($stage === null) {
            return false;
        }

        return $user->role === $stage->requiredRole();
    }

    /**
     * Determine whether the user can submit the proposal.
     *
     * Allowed for: owner when status is draft or revised.
     */
    public function submit(User $user, PengajuanAnggaran $pengajuan): bool
    {
        if ($user->hasEnumRole(UserRole::Admin)) {
            return true;
        }

        if ($user->id !== $pengajuan->user_id) {
            return false;
        }

        return in_array($pengajuan->status_proses, [
            ProposalStatus::Draft,
            ProposalStatus::Revised,
            ProposalStatus::RevisionRequired,
        ], true);
    }
}
