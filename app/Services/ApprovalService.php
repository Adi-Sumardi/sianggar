<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Enums\UserRole;
use App\Models\AmountEditLog;
use App\Models\Approval;
use App\Models\Discussion;
use App\Models\FinanceValidation;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Notifications\NewProposalNotification;
use App\Notifications\ProposalApprovedNotification;
use App\Notifications\ProposalRejectedNotification;
use App\Notifications\ProposalRevisedNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    // =========================================================================
    // Submit & Resubmit
    // =========================================================================

    /**
     * Submit a draft pengajuan for approval.
     * Determines the initial stage based on submitter type (unit/substansi).
     */
    public function submit(PengajuanAnggaran $pengajuan, User $submitter): void
    {
        $submitterType = $submitter->role->isUnit() ? 'unit' : 'substansi';
        $initialStage = $submitterType === 'unit'
            ? ApprovalStage::StaffDirektur
            : ApprovalStage::StaffKeuangan;

        $pengajuan->update([
            'submitter_type' => $submitterType,
            'amount_category' => AmountCategory::fromAmount((float) $pengajuan->jumlah_pengajuan_total)->value,
            'status_proses' => ProposalStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
        ]);

        Approval::create([
            'approvable_type' => PengajuanAnggaran::class,
            'approvable_id' => $pengajuan->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);

        // Notify approvers at initial stage
        $this->notifyApproversForStage($pengajuan, $initialStage);
    }

    /**
     * Resubmit a revised pengajuan — return to the stage that requested revision.
     * This saves time by not restarting from the beginning.
     */
    public function resubmit(PengajuanAnggaran $pengajuan): void
    {
        // Get the stage that requested revision
        $revisionStage = $pengajuan->revision_requested_stage;

        if (! $revisionStage) {
            // Fallback to old behavior if no revision stage recorded
            $this->resubmitFromStart($pengajuan);

            return;
        }

        $targetStage = ApprovalStage::from($revisionStage);

        // Find the last approval at revision stage and reset it to pending
        $lastApproval = $pengajuan->approvals()
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
            $maxOrder = $pengajuan->approvals()->max('stage_order') ?? 0;
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => $targetStage->value,
                'stage_order' => $maxOrder + 1,
                'status' => ApprovalStatus::Pending->value,
            ]);
        }

        // Update pengajuan status
        $pengajuan->update([
            'amount_category' => AmountCategory::fromAmount((float) $pengajuan->jumlah_pengajuan_total)->value,
            'status_proses' => ProposalStatus::Revised->value,
            'current_approval_stage' => $targetStage->value,
            'revision_requested_stage' => null, // Clear after resubmit
            'status_revisi' => null,
        ]);

        // Notify approvers at the revision stage
        $this->notifyApproversForStage($pengajuan, $targetStage);
    }

    /**
     * Resubmit from the very beginning (fallback for old data or first submission).
     */
    private function resubmitFromStart(PengajuanAnggaran $pengajuan): void
    {
        // Delete all previous approval records
        $pengajuan->approvals()->delete();

        // Clear finance validation (will be re-done)
        $pengajuan->financeValidation()?->delete();

        $initialStage = $pengajuan->submitter_type === 'unit'
            ? ApprovalStage::StaffDirektur
            : ApprovalStage::StaffKeuangan;

        $pengajuan->update([
            'amount_category' => AmountCategory::fromAmount((float) $pengajuan->jumlah_pengajuan_total)->value,
            'status_proses' => ProposalStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
            'revision_requested_stage' => null,
            'status_revisi' => null,
            'reference_type' => null,
            'need_lpj' => false,
        ]);

        Approval::create([
            'approvable_type' => PengajuanAnggaran::class,
            'approvable_id' => $pengajuan->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);

        // Notify approvers at initial stage
        $this->notifyApproversForStage($pengajuan, $initialStage);
    }

    // =========================================================================
    // Approve / Revise / Reject
    // =========================================================================

    /**
     * Approve the current stage of a pengajuan.
     */
    public function approve(PengajuanAnggaran $pengajuan, User $approver, ?string $notes = null): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($pengajuan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        // $currentApproval->stage is already cast to ApprovalStage enum by Eloquent
        $stage = $currentApproval->stage;

        // Verify approver has correct role (Admin can approve any stage)
        if ($approver->role !== $stage->requiredRole() && ! $approver->hasEnumRole(\App\Enums\UserRole::Admin)) {
            throw new \RuntimeException('Anda tidak memiliki wewenang untuk approve pada tahap ini.');
        }

        // Mark current approval as approved
        $currentApproval->update([
            'status' => ApprovalStatus::Approved->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        // Update proposal status based on milestone
        $newStatus = $stage->statusAfterApproval();
        if ($newStatus) {
            $pengajuan->update(['status_proses' => $newStatus->value]);
        }

        // Auto-generate voucher number when Bendahara approves
        if ($stage === ApprovalStage::Bendahara && ! $pengajuan->no_voucher) {
            $voucherNumber = $this->generateVoucherNumber();
            $pengajuan->update(['no_voucher' => $voucherNumber]);
        }

        // Determine and create next stage
        $nextStage = $this->getNextStage($pengajuan, $stage);

        if ($nextStage) {
            $nextOrder = $currentApproval->stage_order + 1;

            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => $nextStage->value,
                'stage_order' => $nextOrder,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $pengajuan->update([
                'current_approval_stage' => $nextStage->value,
            ]);

            // Notify approvers at next stage
            $this->notifyApproversForStage($pengajuan, $nextStage);
        } else {
            // End of workflow
            $pengajuan->update([
                'current_approval_stage' => null,
            ]);

            // Dispatch event to update budget balance
            \App\Events\ProposalFullyApproved::dispatch($pengajuan);

            // Notify the creator that proposal is fully approved
            $this->notifyCreatorOfApproval($pengajuan, $approver, $stage, isFullyApproved: true);
        }

        return $currentApproval->fresh();
    }

    /**
     * Approve with finance validation data (StaffKeuangan stage only).
     */
    public function approveWithValidation(
        PengajuanAnggaran $pengajuan,
        User $approver,
        array $validationData,
        ?string $notes = null,
    ): Approval {
        $currentApproval = $this->getCurrentStageApproval($pengajuan);

        if (! $currentApproval || $currentApproval->stage !== ApprovalStage::StaffKeuangan) {
            throw new \RuntimeException('Validasi hanya dapat dilakukan pada tahap Staf Keuangan.');
        }

        // Store finance validation
        FinanceValidation::updateOrCreate(
            ['pengajuan_anggaran_id' => $pengajuan->id],
            [
                'validated_by' => $approver->id,
                'valid_document' => $validationData['valid_document'] ?? false,
                'valid_calculation' => $validationData['valid_calculation'] ?? false,
                'valid_budget_code' => $validationData['valid_budget_code'] ?? false,
                'reasonable_cost' => $validationData['reasonable_cost'] ?? false,
                'reasonable_volume' => $validationData['reasonable_volume'] ?? false,
                'reasonable_executor' => $validationData['reasonable_executor'] ?? false,
                'reference_type' => $validationData['reference_type'],
                'amount_category' => $pengajuan->amount_category ?? AmountCategory::fromAmount((float) $pengajuan->jumlah_pengajuan_total)->value,
                'need_lpj' => $validationData['need_lpj'] ?? false,
                'notes' => $notes,
            ],
        );

        // Update pengajuan with routing params
        $pengajuan->update([
            'reference_type' => $validationData['reference_type'],
            'need_lpj' => $validationData['need_lpj'] ?? false,
        ]);

        return $this->approve($pengajuan, $approver, $notes);
    }

    /**
     * Request revision — send pengajuan back to creator.
     * Saves the current stage so it can return here after revision.
     */
    public function revise(PengajuanAnggaran $pengajuan, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($pengajuan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        // Save the current stage so we can return here after resubmit
        $currentStage = $currentApproval->stage instanceof ApprovalStage
            ? $currentApproval->stage->value
            : $currentApproval->stage;

        $currentApproval->update([
            'status' => ApprovalStatus::Revised->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $pengajuan->update([
            'status_proses' => ProposalStatus::RevisionRequired->value,
            'status_revisi' => 'revisi',
            'date_revisi' => now()->toDateString(),
            'time_revisi' => now()->toTimeString(),
            'current_approval_stage' => null,
            'revision_requested_stage' => $currentStage, // Save for return after revision
        ]);

        // Notify the creator that revision is needed
        $this->notifyCreatorOfRevision($pengajuan, $approver, $notes);

        return $currentApproval->fresh();
    }

    /**
     * Reject a pengajuan — workflow ends permanently.
     */
    public function reject(PengajuanAnggaran $pengajuan, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($pengajuan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        $currentApproval->update([
            'status' => ApprovalStatus::Rejected->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $pengajuan->update([
            'status_proses' => ProposalStatus::Rejected->value,
            'current_approval_stage' => null,
        ]);

        // Notify the creator that proposal is rejected
        $this->notifyCreatorOfRejection($pengajuan, $approver, $notes);

        return $currentApproval->fresh();
    }

    // =========================================================================
    // Amount Editing (Keuangan / Bendahara)
    // =========================================================================

    /**
     * Edit the proposal amount (only Keuangan and Bendahara stages).
     */
    public function editAmount(PengajuanAnggaran $pengajuan, User $editor, float $newAmount, ?string $reason = null): AmountEditLog
    {
        $currentApproval = $this->getCurrentStageApproval($pengajuan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        // $currentApproval->stage is already cast to ApprovalStage enum
        $stage = $currentApproval->stage;

        if (! $stage->canEditAmount()) {
            throw new \RuntimeException('Edit nominal hanya diizinkan pada tahap Keuangan dan Bendahara.');
        }

        $originalAmount = (float) ($pengajuan->approved_amount ?? $pengajuan->jumlah_pengajuan_total);

        $log = AmountEditLog::create([
            'pengajuan_anggaran_id' => $pengajuan->id,
            'edited_by' => $editor->id,
            'original_amount' => $originalAmount,
            'new_amount' => $newAmount,
            'reason' => $reason,
        ]);

        $pengajuan->update([
            'approved_amount' => $newAmount,
        ]);

        return $log;
    }

    // =========================================================================
    // Discussion (Leadership roles)
    // =========================================================================

    /**
     * Roles that can open/manage discussions.
     */
    private function canOpenDiscussion(User $user): bool
    {
        $allowedRoles = [
            UserRole::Ketum,
            UserRole::Sekretaris,
            UserRole::Ketua1,      // Wakil Ketua
            UserRole::Bendahara,
        ];

        return in_array($user->role, $allowedRoles, true);
    }

    /**
     * Open a discussion on a pengajuan.
     * Only Ketum, Sekretaris, Wakil Ketua, and Bendahara can open discussions.
     */
    public function openDiscussion(PengajuanAnggaran $pengajuan, User $opener): Discussion
    {
        if (! $this->canOpenDiscussion($opener)) {
            throw new \RuntimeException('Anda tidak memiliki akses untuk membuka diskusi.');
        }

        $existing = $pengajuan->activeDiscussion;
        if ($existing) {
            throw new \RuntimeException('Diskusi sudah terbuka untuk pengajuan ini.');
        }

        return Discussion::create([
            'pengajuan_anggaran_id' => $pengajuan->id,
            'status' => 'open',
            'opened_by' => $opener->id,
            'opened_at' => now(),
        ]);
    }

    /**
     * Close the active discussion.
     * Only the user who opened the discussion can close it.
     */
    public function closeDiscussion(PengajuanAnggaran $pengajuan, User $closer): Discussion
    {
        $discussion = $pengajuan->activeDiscussion;

        if (! $discussion) {
            throw new \RuntimeException('Tidak ada diskusi yang aktif.');
        }

        // Only the opener can close the discussion
        if ($discussion->opened_by !== $closer->id) {
            throw new \RuntimeException('Hanya yang membuka diskusi yang dapat menutup diskusi ini.');
        }

        $discussion->update([
            'status' => 'closed',
            'closed_by' => $closer->id,
            'closed_at' => now(),
        ]);

        return $discussion->fresh();
    }

    // =========================================================================
    // Voucher & Payment (Kasir / Payment stages)
    // =========================================================================

    /**
     * Print voucher (Kasir stage) — marks voucher as printed and advances.
     * Voucher number is already generated when Bendahara approves.
     */
    public function printVoucher(PengajuanAnggaran $pengajuan, User $kasir): Approval
    {
        if (! $pengajuan->no_voucher) {
            throw new \RuntimeException('Nomor voucher belum di-generate. Pastikan Bendahara sudah approve.');
        }

        $pengajuan->update([
            'print_status' => 'printed',
        ]);

        return $this->approve($pengajuan, $kasir, 'Voucher dicetak: ' . $pengajuan->no_voucher);
    }

    /**
     * Mark as paid (Payment stage) — final step.
     */
    public function markAsPaid(
        PengajuanAnggaran $pengajuan,
        User $processor,
        string $recipientName,
        ?string $paymentMethod = null,
        ?string $notes = null,
    ): Approval {
        $pengajuan->update([
            'status_payment' => 'paid',
            'payment_recipient' => $recipientName,
            'payment_method' => $paymentMethod,
            'payment_notes' => $notes,
            'paid_at' => now(),
            'paid_by' => $processor->id,
        ]);

        return $this->approve($pengajuan, $processor, $notes ?? 'Pembayaran telah diproses ke ' . $recipientName);
    }

    // =========================================================================
    // Routing Engine
    // =========================================================================

    /**
     * Determine the next approval stage based on routing rules.
     *
     * This is the core routing engine that implements the dynamic workflow:
     * - StaffDirektur → StaffKeuangan
     * - StaffKeuangan → Middle approver (based on reference_type)
     * - Middle approver → HIGH: WakilKetua/Sekretaris, LOW: Keuangan
     * - WakilKetua/Sekretaris → Ketum
     * - Ketum → Keuangan
     * - Keuangan → Bendahara → Kasir → Payment → end
     */
    public function getNextStage(PengajuanAnggaran $pengajuan, ApprovalStage $currentStage): ?ApprovalStage
    {
        return match ($currentStage) {
            // Step 1: StaffDirektur always routes to StaffKeuangan
            ApprovalStage::StaffDirektur => ApprovalStage::StaffKeuangan,

            // Step 2: StaffKeuangan routes to middle approver based on reference_type
            ApprovalStage::StaffKeuangan => $this->getMiddleApproverStage($pengajuan),

            // Step 3: Middle approvers route based on amount_category
            ApprovalStage::Direktur => $this->getAfterMiddleApprover($pengajuan, ApprovalStage::WakilKetua),
            ApprovalStage::KabagSdmUmum => $this->getAfterMiddleApprover($pengajuan, ApprovalStage::Sekretaris),
            ApprovalStage::KabagSekretariat => $this->getAfterMiddleApprover($pengajuan, ApprovalStage::Sekretaris),

            // Step 4: WakilKetua and Sekretaris always route to Ketum
            ApprovalStage::WakilKetua, ApprovalStage::Sekretaris => ApprovalStage::Ketum,

            // Step 5: Ketum always routes to Keuangan
            ApprovalStage::Ketum => ApprovalStage::Keuangan,

            // Step 6-9: Linear tail
            ApprovalStage::Keuangan => ApprovalStage::Bendahara,
            ApprovalStage::Bendahara => ApprovalStage::Kasir,
            ApprovalStage::Kasir => ApprovalStage::Payment,

            // End of workflow
            ApprovalStage::Payment => null,
        };
    }

    /**
     * Get the expected full stage chain for timeline display.
     * Returns an ordered array of stage info: [{stage, status, approval}]
     */
    public function getExpectedStages(PengajuanAnggaran $pengajuan): array
    {
        $completedApprovals = $pengajuan->approvals()
            ->orderBy('stage_order')
            ->get()
            ->keyBy('stage');

        $stages = [];
        $currentStage = $pengajuan->submitter_type === 'unit'
            ? ApprovalStage::StaffDirektur
            : ApprovalStage::StaffKeuangan;

        $order = 1;

        while ($currentStage !== null) {
            $approval = $completedApprovals->get($currentStage->value);

            $status = 'future';
            if ($approval) {
                $status = $approval->status instanceof ApprovalStatus
                    ? $approval->status->value
                    : $approval->status;
            } elseif ($pengajuan->current_approval_stage === $currentStage->value) {
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
            if (! $pengajuan->reference_type && $currentStage === ApprovalStage::StaffKeuangan) {
                // Stop here if approval is pending or doesn't exist yet
                $approvalStatus = $approval?->status;
                $isPending = ! $approval ||
                    $approvalStatus === ApprovalStatus::Pending ||
                    $approvalStatus === 'pending';
                if ($isPending) {
                    break;
                }
            }

            $currentStage = $this->getNextStage($pengajuan, $currentStage);
        }

        return $stages;
    }

    // =========================================================================
    // Queries
    // =========================================================================

    /**
     * Get the current pending approval for a pengajuan.
     */
    public function getCurrentStageApproval(PengajuanAnggaran $pengajuan): ?Approval
    {
        return $pengajuan->approvals()
            ->where('status', ApprovalStatus::Pending->value)
            ->orderBy('stage_order')
            ->first();
    }

    /**
     * Get the full approval timeline with approver details.
     */
    public function getApprovalTimeline(PengajuanAnggaran $pengajuan): Collection
    {
        return $pengajuan->approvals()
            ->with('approver')
            ->orderBy('stage_order')
            ->get();
    }

    /**
     * Get all pending pengajuan approvals for a user based on their role.
     */
    public function getPendingForRole(User $user, ?int $unitId = null): Collection
    {
        $role = $user->role;

        // Find which stages this role can approve
        $stages = collect(ApprovalStage::cases())
            ->filter(fn (ApprovalStage $s) => $s->requiredRole() === $role)
            ->pluck('value')
            ->toArray();

        if (empty($stages)) {
            return collect();
        }

        $query = Approval::with(['approvable.user', 'approvable.unitRelation'])
            ->where('approvable_type', PengajuanAnggaran::class)
            ->whereIn('stage', $stages)
            ->where('status', ApprovalStatus::Pending->value)
            ->whereHas('approvable', function ($q) use ($stages, $unitId) {
                $q->whereIn('current_approval_stage', $stages);
                if ($unitId !== null) {
                    $q->where('unit_id', $unitId);
                }
            });

        return $query->get();
    }

    /**
     * Count pending pengajuan approvals for a user based on their role.
     */
    public function countPendingForRole(User $user, ?int $unitId = null): int
    {
        $role = $user->role;

        // Find which stages this role can approve
        $stages = collect(ApprovalStage::cases())
            ->filter(fn (ApprovalStage $s) => $s->requiredRole() === $role)
            ->pluck('value')
            ->toArray();

        if (empty($stages)) {
            return 0;
        }

        $query = Approval::where('approvable_type', PengajuanAnggaran::class)
            ->whereIn('stage', $stages)
            ->where('status', ApprovalStatus::Pending->value)
            ->whereHas('approvable', function ($q) use ($stages, $unitId) {
                $q->whereIn('current_approval_stage', $stages);
                if ($unitId !== null) {
                    $q->where('unit_id', $unitId);
                }
            });

        return $query->count();
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Generate voucher number with format: 001/02/2026 (sequential/month/year).
     * Sequential number resets each month.
     */
    private function generateVoucherNumber(): string
    {
        $now = now();
        $month = $now->format('m');
        $year = $now->format('Y');

        // Get the highest voucher number for this month
        $query = PengajuanAnggaran::whereNotNull('no_voucher')
            ->where('no_voucher', 'like', "%/{$month}/{$year}");

        // Use database-specific ordering
        if (config('database.default') === 'sqlite' || DB::connection()->getDriverName() === 'sqlite') {
            // SQLite: fetch all and sort in PHP
            $latestVoucher = $query->get()
                ->sortByDesc(function ($item) {
                    $parts = explode('/', $item->no_voucher);
                    return (int) ($parts[0] ?? 0);
                })
                ->first();
        } else {
            // MySQL/MariaDB
            $latestVoucher = $query
                ->orderByRaw("CAST(SUBSTRING_INDEX(no_voucher, '/', 1) AS UNSIGNED) DESC")
                ->first();
        }

        $nextSequence = 1;

        if ($latestVoucher && $latestVoucher->no_voucher) {
            // Extract sequence number from voucher (format: 001/02/2026)
            $parts = explode('/', $latestVoucher->no_voucher);
            if (count($parts) === 3) {
                $nextSequence = (int) $parts[0] + 1;
            }
        }

        // Format: 001/02/2026
        return sprintf('%03d/%s/%s', $nextSequence, $month, $year);
    }

    /**
     * Determine the middle approver stage based on reference_type.
     */
    private function getMiddleApproverStage(PengajuanAnggaran $pengajuan): ApprovalStage
    {
        $referenceType = $pengajuan->reference_type;

        if (! $referenceType) {
            throw new \RuntimeException('Reference type belum ditentukan. Staf Keuangan harus melakukan validasi terlebih dahulu.');
        }

        $ref = $referenceType instanceof ReferenceType
            ? $referenceType
            : ReferenceType::from($referenceType);

        return $ref->approvalStage();
    }

    /**
     * Determine routing after middle approver: HIGH → next high-level, LOW → Keuangan.
     */
    private function getAfterMiddleApprover(PengajuanAnggaran $pengajuan, ApprovalStage $highAmountStage): ApprovalStage
    {
        $category = $pengajuan->amount_category;

        $cat = $category instanceof AmountCategory
            ? $category
            : AmountCategory::from($category ?? AmountCategory::fromAmount((float) $pengajuan->jumlah_pengajuan_total)->value);

        return $cat === AmountCategory::High
            ? $highAmountStage
            : ApprovalStage::Keuangan;
    }

    // =========================================================================
    // Notification Helpers
    // =========================================================================

    /**
     * Notify all users who can approve a specific stage.
     */
    private function notifyApproversForStage(PengajuanAnggaran $pengajuan, ApprovalStage $stage): void
    {
        $requiredRole = $stage->requiredRole();

        $approvers = User::where('role', $requiredRole->value)->get();

        foreach ($approvers as $approver) {
            $approver->notify(new NewProposalNotification(
                pengajuan: $pengajuan,
                stage: $stage,
            ));
        }
    }

    /**
     * Notify the proposal creator that it has been approved.
     */
    private function notifyCreatorOfApproval(
        PengajuanAnggaran $pengajuan,
        User $approver,
        ApprovalStage $stage,
        bool $isFullyApproved = false,
    ): void {
        $creator = $pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalApprovedNotification(
                pengajuan: $pengajuan,
                approver: $approver,
                stage: $stage,
                isFullyApproved: $isFullyApproved,
            ));
        }
    }

    /**
     * Notify the proposal creator that revision is required.
     */
    private function notifyCreatorOfRevision(PengajuanAnggaran $pengajuan, User $approver, string $notes): void
    {
        $creator = $pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalRevisedNotification(
                pengajuan: $pengajuan,
                approver: $approver,
                catatan: $notes,
            ));
        }
    }

    /**
     * Notify the proposal creator that it has been rejected.
     */
    private function notifyCreatorOfRejection(PengajuanAnggaran $pengajuan, User $approver, string $notes): void
    {
        $creator = $pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalRejectedNotification(
                pengajuan: $pengajuan,
                approver: $approver,
                catatan: $notes,
            ));
        }
    }
}
