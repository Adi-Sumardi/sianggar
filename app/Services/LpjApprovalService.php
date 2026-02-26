<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\LpjValidation;
use App\Models\User;
use App\Notifications\LpjApprovedNotification;
use App\Notifications\LpjRejectedNotification;
use App\Notifications\LpjRevisedNotification;
use App\Notifications\NewLpjNotification;
use Illuminate\Support\Collection;

/**
 * Service for managing LPJ (Laporan Pertanggungjawaban) approval workflow.
 *
 * Flow:
 * Unit/Substansi → StaffKeuangan (checklist + rujukan) → Middle Approver → Keuangan → Done
 *
 * Differences from Pengajuan workflow:
 * - No routing based on amount (LOW/HIGH)
 * - No Ketum/Wakil Ketua/Sekretaris stages
 * - No Bendahara/Kasir/Payment stages
 * - Has checklist validation at StaffKeuangan stage
 */
class LpjApprovalService
{
    // =========================================================================
    // Submit & Resubmit
    // =========================================================================

    /**
     * Submit a draft LPJ for approval.
     * LPJ always starts at StaffKeuangan stage.
     */
    public function submit(Lpj $lpj, User $submitter): void
    {
        $initialStage = LpjApprovalStage::StaffKeuangan;

        $lpj->update([
            'proses' => LpjStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
        ]);

        Approval::create([
            'approvable_type' => Lpj::class,
            'approvable_id' => $lpj->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);

        // Notify approvers at initial stage
        $this->notifyApproversForStage($lpj, $initialStage);
    }

    /**
     * Resubmit a revised LPJ — return to the stage that requested revision.
     * This saves time by not restarting from the beginning.
     */
    public function resubmit(Lpj $lpj): void
    {
        // Get the stage that requested revision
        $revisionStage = $lpj->revision_requested_stage;

        if (! $revisionStage) {
            // Fallback to old behavior if no revision stage recorded
            $this->resubmitFromStart($lpj);

            return;
        }

        $targetStage = LpjApprovalStage::from($revisionStage);

        // Find the last approval at revision stage and reset it to pending
        $lastApproval = $lpj->approvals()
            ->where('stage', $revisionStage)
            ->orderBy('stage_order', 'desc')
            ->first();

        if ($lastApproval) {
            // Reset the approval that requested revision back to pending
            $lastApproval->update([
                'status' => ApprovalStatus::Pending->value,
                'approved_by' => null,
                'notes' => null,
                'approved_at' => null,
            ]);
        } else {
            // Create new approval at the revision stage
            $maxOrder = $lpj->approvals()->max('stage_order') ?? 0;
            Approval::create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => $targetStage->value,
                'stage_order' => $maxOrder + 1,
                'status' => ApprovalStatus::Pending->value,
            ]);
        }

        // Update LPJ status
        $lpj->update([
            'proses' => LpjStatus::Revised->value,
            'current_approval_stage' => $targetStage->value,
            'revision_requested_stage' => null, // Clear after resubmit
            'status_revisi' => null,
        ]);

        // Notify approvers at the revision stage
        $this->notifyApproversForStage($lpj, $targetStage);
    }

    /**
     * Resubmit from the very beginning (fallback for old data or first submission).
     */
    private function resubmitFromStart(Lpj $lpj): void
    {
        // Delete all previous approval records
        $lpj->approvals()->delete();

        // Clear validation (will be re-done)
        $lpj->validation()?->delete();

        $initialStage = LpjApprovalStage::StaffKeuangan;

        $lpj->update([
            'proses' => LpjStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
            'revision_requested_stage' => null,
            'status_revisi' => null,
            'reference_type' => null,
            'validated_at' => null,
            'validated_by' => null,
            'validation_notes' => null,
        ]);

        Approval::create([
            'approvable_type' => Lpj::class,
            'approvable_id' => $lpj->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);

        // Notify approvers at initial stage
        $this->notifyApproversForStage($lpj, $initialStage);
    }

    // =========================================================================
    // Validate (StaffKeuangan stage)
    // =========================================================================

    /**
     * Validate an LPJ with checklist (StaffKeuangan stage only).
     * This creates the validation record and routes to the middle approver.
     */
    public function validate(Lpj $lpj, User $validator, array $validationData): LpjValidation
    {
        $currentApproval = $this->getCurrentStageApproval($lpj);

        // Compare values since Approval model casts to ApprovalStage but we use LpjApprovalStage
        $currentStageValue = $currentApproval?->stage instanceof \BackedEnum
            ? $currentApproval->stage->value
            : $currentApproval?->stage;

        if (! $currentApproval || $currentStageValue !== LpjApprovalStage::StaffKeuangan->value) {
            throw new \RuntimeException('Validasi hanya dapat dilakukan pada tahap Staf Keuangan.');
        }

        // Verify validator has correct role
        if ($validator->role !== UserRole::StaffKeuangan && ! $validator->hasEnumRole(UserRole::Admin)) {
            throw new \RuntimeException('Anda tidak memiliki wewenang untuk validasi LPJ.');
        }

        // Validate all checklist items are checked
        $requiredFields = [
            'has_activity_identity',
            'has_cover_letter',
            'has_narrative_report',
            'has_financial_report',
            'has_receipts',
        ];

        foreach ($requiredFields as $field) {
            if (empty($validationData[$field])) {
                throw new \RuntimeException('Semua item checklist harus dicentang.');
            }
        }

        // Create validation record
        $validation = LpjValidation::updateOrCreate(
            ['lpj_id' => $lpj->id],
            [
                'validated_by' => $validator->id,
                'has_activity_identity' => $validationData['has_activity_identity'] ?? false,
                'has_cover_letter' => $validationData['has_cover_letter'] ?? false,
                'has_narrative_report' => $validationData['has_narrative_report'] ?? false,
                'has_financial_report' => $validationData['has_financial_report'] ?? false,
                'has_receipts' => $validationData['has_receipts'] ?? false,
                'reference_type' => $validationData['reference_type'],
                'notes' => $validationData['notes'] ?? null,
            ],
        );

        // Update LPJ with routing params
        $lpj->update([
            'reference_type' => $validationData['reference_type'],
            'validated_at' => now(),
            'validated_by' => $validator->id,
            'validation_notes' => $validationData['notes'] ?? null,
        ]);

        // Approve the current stage
        $this->approve($lpj, $validator, $validationData['notes'] ?? null);

        return $validation;
    }

    // =========================================================================
    // Approve / Revise / Reject
    // =========================================================================

    /**
     * Approve the current stage of an LPJ.
     */
    public function approve(Lpj $lpj, User $approver, ?string $notes = null): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($lpj);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        // Convert ApprovalStage to LpjApprovalStage (Approval model casts to ApprovalStage)
        $stageValue = $currentApproval->stage instanceof \BackedEnum
            ? $currentApproval->stage->value
            : $currentApproval->stage;
        $stage = LpjApprovalStage::tryFrom($stageValue);

        if (! $stage) {
            throw new \RuntimeException('Tahap approval tidak valid untuk LPJ.');
        }

        // Verify approver has correct role (Admin can approve any stage)
        if ($approver->role !== $stage->requiredRole() && ! $approver->hasEnumRole(UserRole::Admin)) {
            throw new \RuntimeException('Anda tidak memiliki wewenang untuk approve pada tahap ini.');
        }

        // Mark current approval as approved
        $currentApproval->update([
            'status' => ApprovalStatus::Approved->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        // Update LPJ status based on stage
        $newStatus = $this->getStatusAfterApproval($stage);
        if ($newStatus) {
            $lpj->update(['proses' => $newStatus->value]);
        }

        // Determine and create next stage
        $nextStage = $this->getNextStage($lpj, $stage);

        if ($nextStage) {
            $nextOrder = $currentApproval->stage_order + 1;

            Approval::create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => $nextStage->value,
                'stage_order' => $nextOrder,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $lpj->update([
                'current_approval_stage' => $nextStage->value,
            ]);

            // Notify approvers at next stage
            $this->notifyApproversForStage($lpj, $nextStage);
        } else {
            // End of workflow
            $lpj->update([
                'current_approval_stage' => null,
            ]);

            // Notify the creator that LPJ is fully approved
            $this->notifyCreatorOfApproval($lpj, $approver, isFinal: true);
        }

        return $currentApproval->fresh();
    }

    /**
     * Request revision — send LPJ back to creator.
     * Saves the current stage so it can return here after revision.
     */
    public function revise(Lpj $lpj, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($lpj);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        // Save the current stage so we can return here after resubmit
        $currentStage = $currentApproval->stage instanceof \BackedEnum
            ? $currentApproval->stage->value
            : $currentApproval->stage;

        $currentApproval->update([
            'status' => ApprovalStatus::Revised->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $lpj->update([
            'proses' => LpjStatus::Revised->value,
            'status_revisi' => 'revisi',
            'current_approval_stage' => null,
            'revision_requested_stage' => $currentStage, // Save for return after revision
        ]);

        // Seed initial revision comment thread
        app(RevisionCommentService::class)->seedInitialNote($lpj, $approver, $notes);

        // Notify the creator that revision is needed
        $this->notifyCreatorOfRevision($lpj, $approver, $notes);

        return $currentApproval->fresh();
    }

    /**
     * Reject an LPJ — workflow ends permanently.
     */
    public function reject(Lpj $lpj, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($lpj);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        $currentApproval->update([
            'status' => ApprovalStatus::Rejected->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $lpj->update([
            'proses' => LpjStatus::Rejected->value,
            'current_approval_stage' => null,
        ]);

        // Notify the creator that LPJ is rejected
        $this->notifyCreatorOfRejection($lpj, $approver, $notes);

        return $currentApproval->fresh();
    }

    // =========================================================================
    // Routing Engine
    // =========================================================================

    /**
     * Determine the next approval stage based on routing rules.
     *
     * LPJ Routing:
     * - StaffKeuangan → Middle Approver (based on reference_type)
     * - Direktur → Keuangan
     * - KabagSdmUmum → Keuangan
     * - KabagSekretariat → Keuangan
     * - Keuangan → null (end)
     */
    public function getNextStage(Lpj $lpj, LpjApprovalStage $currentStage): ?LpjApprovalStage
    {
        return match ($currentStage) {
            // StaffKeuangan routes to middle approver based on reference_type
            LpjApprovalStage::StaffKeuangan => $this->getMiddleApproverStage($lpj),

            // All middle approvers route to Keuangan
            LpjApprovalStage::Direktur,
            LpjApprovalStage::KabagSdmUmum,
            LpjApprovalStage::KabagSekretariat => LpjApprovalStage::Keuangan,

            // Keuangan is the end
            LpjApprovalStage::Keuangan => null,
        };
    }

    /**
     * Get the LPJ status after a stage is approved.
     */
    private function getStatusAfterApproval(LpjApprovalStage $stage): ?LpjStatus
    {
        return match ($stage) {
            LpjApprovalStage::StaffKeuangan => LpjStatus::Validated,
            LpjApprovalStage::Direktur,
            LpjApprovalStage::KabagSdmUmum,
            LpjApprovalStage::KabagSekretariat => LpjStatus::ApprovedByMiddle,
            LpjApprovalStage::Keuangan => LpjStatus::Approved,
        };
    }

    /**
     * Get the expected full stage chain for timeline display.
     */
    public function getExpectedStages(Lpj $lpj): array
    {
        $completedApprovals = $lpj->approvals()
            ->orderBy('stage_order')
            ->get()
            ->keyBy(fn ($a) => $a->stage instanceof LpjApprovalStage ? $a->stage->value : $a->stage);

        $stages = [];
        $currentStage = LpjApprovalStage::StaffKeuangan;
        $order = 1;

        while ($currentStage !== null) {
            $approval = $completedApprovals->get($currentStage->value);

            $status = 'future';
            if ($approval) {
                $approvalStatus = $approval->status instanceof ApprovalStatus
                    ? $approval->status->value
                    : $approval->status;
                // If the approval is pending and this is the current stage, mark as 'current'
                $currentStageValue = $lpj->current_approval_stage instanceof LpjApprovalStage
                    ? $lpj->current_approval_stage->value
                    : $lpj->current_approval_stage;
                if ($approvalStatus === 'pending' && $currentStageValue === $currentStage->value) {
                    $status = 'current';
                } else {
                    $status = $approvalStatus;
                }
            } elseif ($lpj->current_approval_stage?->value === $currentStage->value) {
                $status = 'current';
            }

            $stages[] = [
                'stage' => $currentStage->value,
                'label' => $currentStage->label(),
                'status' => $status,
                'approval' => $approval,
                'order' => $order++,
            ];

            // For stages that haven't been reached yet and we don't have reference_type,
            // we can't compute the full chain — stop at StaffKeuangan
            if (! $lpj->reference_type && $currentStage === LpjApprovalStage::StaffKeuangan) {
                $approvalStatus = $approval?->status;
                $isPending = ! $approval ||
                    $approvalStatus === ApprovalStatus::Pending ||
                    $approvalStatus === 'pending';
                if ($isPending) {
                    break;
                }
            }

            $currentStage = $this->getNextStage($lpj, $currentStage);
        }

        return $stages;
    }

    // =========================================================================
    // Queries
    // =========================================================================

    /**
     * Get the current pending approval for an LPJ.
     */
    public function getCurrentStageApproval(Lpj $lpj): ?Approval
    {
        return $lpj->approvals()
            ->where('status', ApprovalStatus::Pending->value)
            ->orderBy('stage_order')
            ->first();
    }

    /**
     * Get the full approval timeline with approver details.
     */
    public function getApprovalTimeline(Lpj $lpj): Collection
    {
        return $lpj->approvals()
            ->with('approver')
            ->orderBy('stage_order')
            ->get();
    }

    /**
     * Get all pending LPJ approvals for a user based on their role.
     */
    public function getPendingForRole(User $user): Collection
    {
        $role = $user->role;

        // Find which stages this role can approve
        $stages = collect(LpjApprovalStage::cases())
            ->filter(fn (LpjApprovalStage $s) => $s->requiredRole() === $role)
            ->pluck('value')
            ->toArray();

        if (empty($stages)) {
            return collect();
        }

        return Approval::with(['approvable.pengajuanAnggaran'])
            ->where('approvable_type', Lpj::class)
            ->whereIn('stage', $stages)
            ->where('status', ApprovalStatus::Pending->value)
            ->whereHas('approvable', function ($q) use ($stages) {
                $q->whereIn('current_approval_stage', $stages);
            })
            ->get();
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Determine the middle approver stage based on reference_type.
     */
    private function getMiddleApproverStage(Lpj $lpj): LpjApprovalStage
    {
        $referenceType = $lpj->reference_type;

        if (! $referenceType) {
            throw new \RuntimeException('Rujukan LPJ belum ditentukan. Staf Keuangan harus melakukan validasi terlebih dahulu.');
        }

        $ref = $referenceType instanceof ReferenceType
            ? $referenceType
            : ReferenceType::from($referenceType);

        return LpjApprovalStage::fromReferenceType($ref);
    }

    // =========================================================================
    // Notification Helpers
    // =========================================================================

    /**
     * Notify all users who can approve a specific stage.
     */
    private function notifyApproversForStage(Lpj $lpj, LpjApprovalStage $stage): void
    {
        $requiredRole = $stage->requiredRole();

        $approvers = User::where('role', $requiredRole->value)->get();

        foreach ($approvers as $approver) {
            $approver->notify(new NewLpjNotification(
                lpj: $lpj,
                stage: $stage,
            ));
        }
    }

    /**
     * Notify the LPJ creator that it has been approved.
     */
    private function notifyCreatorOfApproval(Lpj $lpj, User $approver, bool $isFinal = false): void
    {
        $creator = $lpj->pengajuanAnggaran?->user;

        if ($creator) {
            $creator->notify(new LpjApprovedNotification(
                lpj: $lpj,
                approver: $approver,
                isFinal: $isFinal,
            ));
        }
    }

    /**
     * Notify the LPJ creator that revision is required.
     */
    private function notifyCreatorOfRevision(Lpj $lpj, User $approver, string $notes): void
    {
        $creator = $lpj->pengajuanAnggaran?->user;

        if ($creator) {
            $creator->notify(new LpjRevisedNotification(
                lpj: $lpj,
                approver: $approver,
                catatan: $notes,
            ));
        }
    }

    /**
     * Notify the LPJ creator that it has been rejected.
     */
    private function notifyCreatorOfRejection(Lpj $lpj, User $approver, string $notes): void
    {
        $creator = $lpj->pengajuanAnggaran?->user;

        if ($creator) {
            $creator->notify(new LpjRejectedNotification(
                lpj: $lpj,
                approver: $approver,
                catatan: $notes,
            ));
        }
    }
}
