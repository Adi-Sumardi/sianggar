<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\PerubahanAnggaranStatus;
use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\PerubahanAnggaranItem;
use App\Models\PerubahanAnggaranLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PerubahanAnggaranService
{
    // =========================================================================
    // Submit & Resubmit
    // =========================================================================

    /**
     * Submit a draft perubahan anggaran for approval.
     * Determines the initial stage based on submitter type (unit/substansi).
     */
    public function submit(PerubahanAnggaran $perubahan, User $submitter): void
    {
        // Validate items exist
        if ($perubahan->items()->count() === 0) {
            throw new \RuntimeException('Minimal harus ada 1 item perubahan anggaran.');
        }

        // Check all source budgets have sufficient balance
        foreach ($perubahan->items as $item) {
            if (! $item->hasEnoughSourceBalance()) {
                $source = $item->sourceDetailMataAnggaran;
                throw new \RuntimeException(
                    sprintf(
                        'Saldo anggaran "%s" tidak mencukupi untuk transfer Rp %s',
                        $source?->nama ?? 'Unknown',
                        number_format((float) $item->amount, 0, ',', '.')
                    )
                );
            }
        }

        $submitterType = $submitter->role->isUnit() ? 'unit' : 'substansi';
        $initialStage = $this->getInitialStage($submitterType);

        // Update total amount
        $perubahan->updateTotalAmount();

        $perubahan->update([
            'submitter_type' => $submitterType,
            'status' => PerubahanAnggaranStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
        ]);

        Approval::create([
            'approvable_type' => PerubahanAnggaran::class,
            'approvable_id' => $perubahan->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);
    }

    /**
     * Resubmit a revised perubahan anggaran.
     */
    public function resubmit(PerubahanAnggaran $perubahan): void
    {
        // Re-check balances
        foreach ($perubahan->items as $item) {
            if (! $item->hasEnoughSourceBalance()) {
                $source = $item->sourceDetailMataAnggaran;
                throw new \RuntimeException(
                    sprintf(
                        'Saldo anggaran "%s" tidak mencukupi untuk transfer Rp %s',
                        $source?->nama ?? 'Unknown',
                        number_format((float) $item->amount, 0, ',', '.')
                    )
                );
            }
        }

        // Delete all previous approval records
        $perubahan->approvals()->delete();

        // Update total amount
        $perubahan->updateTotalAmount();

        $initialStage = $this->getInitialStage($perubahan->submitter_type);

        $perubahan->update([
            'status' => PerubahanAnggaranStatus::Submitted->value,
            'current_approval_stage' => $initialStage->value,
        ]);

        Approval::create([
            'approvable_type' => PerubahanAnggaran::class,
            'approvable_id' => $perubahan->id,
            'stage' => $initialStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending->value,
        ]);
    }

    // =========================================================================
    // Approve / Revise / Reject
    // =========================================================================

    /**
     * Approve the current stage of a perubahan anggaran.
     * When Bendahara approves, automatically execute the budget transfer.
     */
    public function approve(PerubahanAnggaran $perubahan, User $approver, ?string $notes = null): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($perubahan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        $stage = $currentApproval->stage;

        // Verify approver has correct role
        if (! $this->canApproveStage($approver, $stage)) {
            throw new \RuntimeException('Anda tidak memiliki wewenang untuk approve pada tahap ini.');
        }

        // Mark current approval as approved
        $currentApproval->update([
            'status' => ApprovalStatus::Approved->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        // Update status based on stage
        $newStatus = $this->getStatusAfterApproval($stage);
        $perubahan->update(['status' => $newStatus->value]);

        // Determine next stage
        $nextStage = $this->getNextStage($perubahan, $stage);

        if ($nextStage) {
            $nextOrder = $currentApproval->stage_order + 1;

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => $nextStage->value,
                'stage_order' => $nextOrder,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $perubahan->update([
                'current_approval_stage' => $nextStage->value,
            ]);
        } else {
            // End of workflow - execute the transfer
            $this->executeTransfer($perubahan, $approver);

            $perubahan->update([
                'current_approval_stage' => null,
                'processed_at' => now(),
                'processed_by' => $approver->id,
            ]);
        }

        return $currentApproval->fresh();
    }

    /**
     * Request revision — send perubahan back to creator.
     */
    public function revise(PerubahanAnggaran $perubahan, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($perubahan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        $currentApproval->update([
            'status' => ApprovalStatus::Revised->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $perubahan->update([
            'status' => PerubahanAnggaranStatus::RevisionRequired->value,
            'current_approval_stage' => null,
        ]);

        // Seed initial revision comment thread
        app(RevisionCommentService::class)->seedInitialNote($perubahan, $approver, $notes);

        return $currentApproval->fresh();
    }

    /**
     * Reject a perubahan anggaran — workflow ends permanently.
     */
    public function reject(PerubahanAnggaran $perubahan, User $approver, string $notes): Approval
    {
        $currentApproval = $this->getCurrentStageApproval($perubahan);

        if (! $currentApproval) {
            throw new \RuntimeException('Tidak ada tahap approval yang aktif.');
        }

        $currentApproval->update([
            'status' => ApprovalStatus::Rejected->value,
            'approved_by' => $approver->id,
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        $perubahan->update([
            'status' => PerubahanAnggaranStatus::Rejected->value,
            'current_approval_stage' => null,
        ]);

        return $currentApproval->fresh();
    }

    // =========================================================================
    // Budget Transfer Execution
    // =========================================================================

    /**
     * Execute the budget transfer for all items.
     * Called when Bendahara (final approver) approves.
     */
    public function executeTransfer(PerubahanAnggaran $perubahan, User $executor): void
    {
        DB::transaction(function () use ($perubahan, $executor) {
            foreach ($perubahan->items as $item) {
                $this->executeItemTransfer($perubahan, $item, $executor);
            }
        });
    }

    /**
     * Execute a single item transfer with optimistic locking.
     * For 'tambah' type: only add to target (no source deduction)
     * For 'geser' type: deduct from source and add to target
     */
    private function executeItemTransfer(
        PerubahanAnggaran $perubahan,
        PerubahanAnggaranItem $item,
        User $executor,
    ): void {
        $amount = (float) $item->amount;
        $isTambah = $item->type === 'tambah';

        // Lock target for update
        $target = DetailMataAnggaran::lockForUpdate()->find($item->target_detail_mata_anggaran_id);

        if (! $target) {
            throw new \RuntimeException('Detail mata anggaran tujuan tidak ditemukan.');
        }

        $targetBefore = (float) $target->balance;
        $sourceBefore = 0;
        $sourceAfter = 0;
        $source = null;

        // For 'geser' type, also handle source
        if (! $isTambah) {
            $source = DetailMataAnggaran::lockForUpdate()->find($item->source_detail_mata_anggaran_id);

            if (! $source) {
                throw new \RuntimeException('Detail mata anggaran asal tidak ditemukan.');
            }

            $sourceBefore = (float) $source->balance;

            // Verify sufficient balance
            if ($sourceBefore < $amount) {
                throw new \RuntimeException(
                    sprintf(
                        'Saldo anggaran "%s" tidak mencukupi. Tersedia: Rp %s, Diminta: Rp %s',
                        $source->nama,
                        number_format($sourceBefore, 0, ',', '.'),
                        number_format($amount, 0, ',', '.')
                    )
                );
            }

            // Deduct from source
            $source->update([
                'balance' => $sourceBefore - $amount,
            ]);
            $sourceAfter = $sourceBefore - $amount;
        }

        // Add to target
        $target->update([
            'balance' => $targetBefore + $amount,
        ]);

        // Log the transfer
        PerubahanAnggaranLog::create([
            'perubahan_anggaran_id' => $perubahan->id,
            'perubahan_anggaran_item_id' => $item->id,
            'source_detail_mata_anggaran_id' => $source?->id,
            'target_detail_mata_anggaran_id' => $target->id,
            'source_saldo_before' => $sourceBefore,
            'source_saldo_after' => $sourceAfter,
            'target_saldo_before' => $targetBefore,
            'target_saldo_after' => $targetBefore + $amount,
            'amount' => $amount,
            'executed_by' => $executor->id,
            'executed_at' => now(),
        ]);
    }

    // =========================================================================
    // Routing Engine
    // =========================================================================

    /**
     * Get the initial approval stage based on submitter type.
     */
    public function getInitialStage(string $submitterType): ApprovalStage
    {
        return $submitterType === 'unit'
            ? ApprovalStage::Direktur
            : ApprovalStage::KabagSekretariat;
    }

    /**
     * Determine the next approval stage.
     *
     * Routing rules:
     * Unit path:      Direktur → WakilKetua → Ketum → Keuangan → Bendahara
     * Substansi path: KabagSekretariat → Sekretaris → Ketum → Keuangan → Bendahara
     */
    public function getNextStage(PerubahanAnggaran $perubahan, ApprovalStage $currentStage): ?ApprovalStage
    {
        return match ($currentStage) {
            // Unit path
            ApprovalStage::Direktur => ApprovalStage::WakilKetua,
            ApprovalStage::WakilKetua => ApprovalStage::Ketum,

            // Substansi path
            ApprovalStage::KabagSekretariat => ApprovalStage::Sekretaris,
            ApprovalStage::Sekretaris => ApprovalStage::Ketum,

            // Common path (both converge)
            ApprovalStage::Ketum => ApprovalStage::Keuangan,
            ApprovalStage::Keuangan => ApprovalStage::Bendahara,

            // End of workflow
            ApprovalStage::Bendahara => null,

            // Default (shouldn't happen)
            default => null,
        };
    }

    /**
     * Get the status after a stage is approved.
     */
    private function getStatusAfterApproval(ApprovalStage $stage): PerubahanAnggaranStatus
    {
        return match ($stage) {
            ApprovalStage::Direktur, ApprovalStage::KabagSekretariat => PerubahanAnggaranStatus::ApprovedLevel1,
            ApprovalStage::WakilKetua, ApprovalStage::Sekretaris => PerubahanAnggaranStatus::ApprovedLevel2,
            ApprovalStage::Ketum => PerubahanAnggaranStatus::ApprovedLevel3,
            ApprovalStage::Keuangan => PerubahanAnggaranStatus::ApprovedLevel4,
            ApprovalStage::Bendahara => PerubahanAnggaranStatus::Processed,
            default => PerubahanAnggaranStatus::Submitted,
        };
    }

    /**
     * Get expected stages based on submitter type.
     *
     * @return array<array{stage: string, label: string, status: string, approval: ?Approval, order: int}>
     */
    public function getExpectedStages(PerubahanAnggaran $perubahan): array
    {
        $completedApprovals = $perubahan->approvals()
            ->orderBy('stage_order')
            ->get()
            ->keyBy('stage');

        $stagePath = $perubahan->submitter_type === 'unit'
            ? [
                ApprovalStage::Direktur,
                ApprovalStage::WakilKetua,
                ApprovalStage::Ketum,
                ApprovalStage::Keuangan,
                ApprovalStage::Bendahara,
            ]
            : [
                ApprovalStage::KabagSekretariat,
                ApprovalStage::Sekretaris,
                ApprovalStage::Ketum,
                ApprovalStage::Keuangan,
                ApprovalStage::Bendahara,
            ];

        $stages = [];
        $order = 1;

        foreach ($stagePath as $stage) {
            $approval = $completedApprovals->get($stage->value);

            $status = 'future';
            if ($approval) {
                $status = $approval->status instanceof ApprovalStatus
                    ? $approval->status->value
                    : $approval->status;
            } elseif ($perubahan->current_approval_stage === $stage->value) {
                $status = 'current';
            }

            $stages[] = [
                'stage' => $stage->value,
                'label' => $stage->label(),
                'status' => $status,
                'approval' => $approval,
                'order' => $order++,
            ];
        }

        return $stages;
    }

    // =========================================================================
    // Queries
    // =========================================================================

    /**
     * Get the current pending approval for a perubahan.
     */
    public function getCurrentStageApproval(PerubahanAnggaran $perubahan): ?Approval
    {
        return $perubahan->approvals()
            ->where('status', ApprovalStatus::Pending->value)
            ->orderBy('stage_order')
            ->first();
    }

    /**
     * Get all pending perubahan approvals for a user based on their role.
     */
    public function getPendingForRole(User $user): Collection
    {
        $role = $user->role;

        // Find which stages this role can approve
        $stages = $this->getStagesForRole($role);

        if (empty($stages)) {
            return collect();
        }

        return Approval::with(['approvable.user', 'approvable.items'])
            ->where('approvable_type', PerubahanAnggaran::class)
            ->whereIn('stage', $stages)
            ->where('status', ApprovalStatus::Pending->value)
            ->whereHas('approvable', function ($q) use ($stages) {
                $q->whereIn('current_approval_stage', $stages);
            })
            ->get();
    }

    /**
     * Check if user can approve a specific stage.
     */
    private function canApproveStage(User $user, ApprovalStage $stage): bool
    {
        // Admin can approve any stage
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return $stage->requiredRole() === $user->role;
    }

    /**
     * Get approval stages for a user role.
     *
     * @return array<string>
     */
    private function getStagesForRole(UserRole $role): array
    {
        $mapping = [
            UserRole::Direktur->value => [ApprovalStage::Direktur->value],
            UserRole::Sekretariat->value => [ApprovalStage::KabagSekretariat->value],
            UserRole::Ketua1->value => [ApprovalStage::WakilKetua->value],
            UserRole::Sekretaris->value => [ApprovalStage::Sekretaris->value],
            UserRole::Ketum->value => [ApprovalStage::Ketum->value],
            UserRole::Keuangan->value => [ApprovalStage::Keuangan->value],
            UserRole::Bendahara->value => [ApprovalStage::Bendahara->value],
        ];

        return $mapping[$role->value] ?? [];
    }

    // =========================================================================
    // Number Generation
    // =========================================================================

    /**
     * Generate nomor perubahan with format: PA-001/02/2026 (sequential/month/year).
     */
    public function generateNomorPerubahan(): string
    {
        $now = now();
        $month = $now->format('m');
        $year = $now->format('Y');

        $prefix = 'PA';

        // Get the highest number for this month
        $query = PerubahanAnggaran::where('nomor_perubahan', 'like', "{$prefix}-%/{$month}/{$year}");

        // Use database-specific ordering
        if (config('database.default') === 'sqlite' || DB::connection()->getDriverName() === 'sqlite') {
            // SQLite: fetch all and sort in PHP
            $latest = $query->get()
                ->sortByDesc(function ($item) use ($prefix) {
                    $parts = explode('/', $item->nomor_perubahan);
                    if (count($parts) >= 1) {
                        $seqPart = str_replace("{$prefix}-", '', $parts[0]);
                        return (int) $seqPart;
                    }
                    return 0;
                })
                ->first();
        } else {
            // MySQL/MariaDB
            $latest = $query
                ->orderByRaw("CAST(SUBSTRING(SUBSTRING_INDEX(nomor_perubahan, '/', 1), 4) AS UNSIGNED) DESC")
                ->first();
        }

        $nextSequence = 1;

        if ($latest && $latest->nomor_perubahan) {
            // Extract sequence number (format: PA-001/02/2026)
            $parts = explode('/', $latest->nomor_perubahan);
            if (count($parts) === 3) {
                $seqPart = str_replace("{$prefix}-", '', $parts[0]);
                $nextSequence = (int) $seqPart + 1;
            }
        }

        // Format: PA-001/02/2026
        return sprintf('%s-%03d/%s/%s', $prefix, $nextSequence, $month, $year);
    }
}
