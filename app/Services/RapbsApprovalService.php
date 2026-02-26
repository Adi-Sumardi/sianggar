<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Apbs;
use App\Models\ApbsItem;
use App\Models\Rapbs;
use App\Models\RapbsApproval;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RapbsApprovalService
{
    /**
     * Submit RAPBS untuk approval.
     */
    public function submit(Rapbs $rapbs, User $submitter): void
    {
        DB::transaction(function () use ($rapbs, $submitter) {
            // Determine if submitter is Unit or Substansi
            $isUnit = $submitter->role->isUnit();
            $firstStage = RapbsApprovalStage::getFirstStage($isUnit);

            // Create first approval record
            RapbsApproval::create([
                'rapbs_id' => $rapbs->id,
                'user_id' => $submitter->id,
                'stage' => $firstStage->value,
                'stage_order' => 1,
                'status' => 'pending',
            ]);

            // Update RAPBS status
            $rapbs->update([
                'status' => RapbsStatus::Submitted,
                'current_approval_stage' => $firstStage->value,
                'submitted_by' => $submitter->id,
                'submitted_at' => now(),
            ]);

            // Log activity
            ActivityLog::log($rapbs, 'submitted', null, ['status' => 'submitted'], $submitter->id);
        });
    }

    /**
     * Approve current stage.
     */
    public function approve(Rapbs $rapbs, User $approver, ?string $notes = null): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            if (!$currentApproval) {
                throw new \Exception('Tidak ada approval yang pending');
            }

            // Validate approver role (Admin can override any stage)
            $currentStage = $currentApproval->stage;
            $requiredRole = $currentStage->requiredRole();
            $isAdmin = $approver->role === UserRole::Admin;

            if (!$isAdmin && $approver->role !== $requiredRole) {
                throw new \Exception("Anda tidak memiliki akses untuk approve stage ini. Diperlukan role: {$requiredRole->label()}");
            }

            // Mark current approval as approved
            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'approved',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            // Determine submitter type
            $isUnit = $rapbs->submitter?->role->isUnit() ?? true;

            // Get next stage
            $nextStage = RapbsApprovalStage::getNextStage($currentStage, $isUnit);

            if ($nextStage) {
                // Create next approval record
                RapbsApproval::create([
                    'rapbs_id' => $rapbs->id,
                    'user_id' => $approver->id,
                    'stage' => $nextStage->value,
                    'stage_order' => $currentApproval->stage_order + 1,
                    'status' => 'pending',
                ]);

                $rapbs->update([
                    'status' => RapbsStatus::InReview,
                    'current_approval_stage' => $nextStage->value,
                ]);
            } else {
                // Final approval (Bendahara) - generate APBS
                $rapbs->update([
                    'status' => RapbsStatus::Approved,
                    'current_approval_stage' => null,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                ]);

                $this->generateApbs($rapbs);
            }

            ActivityLog::log(
                $rapbs,
                'approved',
                ['stage' => $currentStage->value],
                ['stage' => $nextStage?->value, 'notes' => $notes],
                $approver->id
            );

            return $currentApproval;
        });
    }

    /**
     * Request revision.
     */
    public function revise(Rapbs $rapbs, User $approver, string $notes): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            if (!$currentApproval) {
                throw new \Exception('Tidak ada approval yang pending');
            }

            $currentStage = $currentApproval->stage;

            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'revised',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $rapbs->update([
                'status' => RapbsStatus::Draft,
                'current_approval_stage' => null,
            ]);

            ActivityLog::log(
                $rapbs,
                'revised',
                ['stage' => $currentStage->value],
                ['notes' => $notes],
                $approver->id
            );

            // Seed initial revision comment thread
            app(RevisionCommentService::class)->seedInitialNote($rapbs, $approver, $notes);

            return $currentApproval;
        });
    }

    /**
     * Reject RAPBS.
     */
    public function reject(Rapbs $rapbs, User $approver, string $notes): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            if (!$currentApproval) {
                throw new \Exception('Tidak ada approval yang pending');
            }

            $currentStage = $currentApproval->stage;

            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'rejected',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $rapbs->update([
                'status' => RapbsStatus::Rejected,
                'current_approval_stage' => null,
            ]);

            ActivityLog::log(
                $rapbs,
                'rejected',
                ['stage' => $currentStage->value],
                ['notes' => $notes],
                $approver->id
            );

            return $currentApproval;
        });
    }

    /**
     * Generate APBS from approved RAPBS.
     */
    protected function generateApbs(Rapbs $rapbs): Apbs
    {
        // Eager-load items with detailMataAnggaran to prevent N+1 in the loop below
        // Also load unit for generateApbsNumber()
        $rapbs->load(['items.detailMataAnggaran', 'unit']);

        // Update RAPBS status to ApbsGenerated
        $rapbs->update(['status' => RapbsStatus::ApbsGenerated]);

        // Create APBS
        $apbs = Apbs::create([
            'unit_id' => $rapbs->unit_id,
            'rapbs_id' => $rapbs->id,
            'tahun' => $rapbs->tahun,
            'total_anggaran' => $rapbs->total_anggaran,
            'total_realisasi' => 0,
            'sisa_anggaran' => $rapbs->total_anggaran,
            'nomor_dokumen' => $this->generateApbsNumber($rapbs),
            'tanggal_pengesahan' => now()->toDateString(),
            'status' => 'active',
        ]);

        // Copy RAPBS items to APBS items
        foreach ($rapbs->items as $rapbsItem) {
            ApbsItem::create([
                'apbs_id' => $apbs->id,
                'rapbs_item_id' => $rapbsItem->id,
                'mata_anggaran_id' => $rapbsItem->mata_anggaran_id,
                'detail_mata_anggaran_id' => $rapbsItem->detail_mata_anggaran_id,
                'kode_coa' => $rapbsItem->kode_coa,
                'nama' => $rapbsItem->nama,
                'anggaran' => $rapbsItem->jumlah,
                'realisasi' => 0,
                'sisa' => $rapbsItem->jumlah,
            ]);

            // Update DetailMataAnggaran balance if linked
            if ($rapbsItem->detail_mata_anggaran_id && $rapbsItem->detailMataAnggaran) {
                $rapbsItem->detailMataAnggaran->update([
                    'anggaran_awal' => $rapbsItem->jumlah,
                    'balance' => $rapbsItem->jumlah,
                ]);
            }
        }

        // Update RAPBS status to Active (budget is now active)
        $rapbs->update(['status' => RapbsStatus::Active]);

        ActivityLog::log($rapbs, 'apbs_generated', null, ['apbs_id' => $apbs->id, 'nomor_dokumen' => $apbs->nomor_dokumen]);

        return $apbs;
    }

    /**
     * Generate APBS document number.
     */
    protected function generateApbsNumber(Rapbs $rapbs): string
    {
        $count = Apbs::where('tahun', $rapbs->tahun)->count() + 1;
        $unitKode = $rapbs->unit?->kode ?? 'UNIT';

        return sprintf('APBS/%s/%s/%03d', $unitKode, $rapbs->tahun, $count);
    }

    /**
     * Get pending approvals for a user based on their role.
     */
    public function getPendingForUser(User $user): Collection
    {
        $role = $user->role;
        $isAdmin = $role === UserRole::Admin;

        // Admin can see all pending RAPBS
        if ($isAdmin) {
            return Rapbs::where(function ($query) {
                $query->where('status', RapbsStatus::Submitted)
                    ->orWhere('status', RapbsStatus::Verified)
                    ->orWhere('status', RapbsStatus::InReview);
            })
                ->with(['unit.mataAnggarans', 'items', 'currentApproval', 'submitter'])
                ->orderBy('submitted_at')
                ->get();
        }

        // Find stages that match user's role
        $matchingStages = collect(RapbsApprovalStage::cases())
            ->filter(fn ($stage) => $stage->requiredRole() === $role)
            ->map(fn ($stage) => $stage->value)
            ->toArray();

        if (empty($matchingStages)) {
            return new Collection();
        }

        return Rapbs::whereIn('current_approval_stage', $matchingStages)
            ->where(function ($query) {
                $query->where('status', RapbsStatus::Submitted)
                    ->orWhere('status', RapbsStatus::Verified)
                    ->orWhere('status', RapbsStatus::InReview);
            })
            ->with(['unit.mataAnggarans', 'items', 'currentApproval', 'submitter'])
            ->orderBy('submitted_at')
            ->get();
    }

    /**
     * Check if user can approve current stage.
     */
    public function canApprove(Rapbs $rapbs, User $user): bool
    {
        if (!$rapbs->current_approval_stage) {
            return false;
        }

        // Admin can approve any stage
        if ($user->role === UserRole::Admin) {
            return true;
        }

        $requiredRole = $rapbs->current_approval_stage->requiredRole();

        return $user->role === $requiredRole;
    }

    /**
     * Get approval history for a RAPBS.
     */
    public function getApprovalHistory(Rapbs $rapbs): Collection
    {
        return $rapbs->approvals()
            ->with('user')
            ->orderBy('stage_order')
            ->get();
    }
}
