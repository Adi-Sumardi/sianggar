<?php

declare(strict_types=1);

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Enums\UserRole;
use App\Models\Apbs;
use App\Models\ApbsItem;
use App\Models\DetailMataAnggaran;
use App\Models\Rapbs;
use App\Models\RapbsApproval;
use App\Models\RapbsItem;
use App\Models\Unit;
use App\Models\User;
use App\Services\RapbsApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->service = new RapbsApprovalService();
});

// ---------------------------------------------------------------------------
// Helper: create a RAPBS with items at a specific stage
// ---------------------------------------------------------------------------

function createRapbsAtStage(
    RapbsApprovalStage $stage,
    ?User $submitter = null,
    ?Unit $unit = null,
): Rapbs {
    $submitter ??= User::factory()->unit()->create();
    $unit ??= Unit::factory()->create();

    $rapbs = Rapbs::factory()->create([
        'unit_id' => $unit->id,
        'status' => RapbsStatus::Submitted,
        'current_approval_stage' => $stage->value,
        'submitted_by' => $submitter->id,
        'submitted_at' => now(),
        'total_anggaran' => 50_000_000,
    ]);

    RapbsApproval::create([
        'rapbs_id' => $rapbs->id,
        'user_id' => $submitter->id,
        'stage' => $stage->value,
        'stage_order' => 1,
        'status' => 'pending',
    ]);

    return $rapbs;
}

function createRapbsItem(Rapbs $rapbs, float $jumlah = 10_000_000, ?DetailMataAnggaran $dma = null): RapbsItem
{
    $dma ??= DetailMataAnggaran::factory()->create();

    return RapbsItem::create([
        'rapbs_id' => $rapbs->id,
        'mata_anggaran_id' => $dma->mata_anggaran_id,
        'detail_mata_anggaran_id' => $dma->id,
        'kode_coa' => 'COA-' . fake()->unique()->numberBetween(1, 99999),
        'nama' => fake()->sentence(3),
        'uraian' => fake()->sentence(),
        'volume' => 1,
        'satuan' => 'paket',
        'harga_satuan' => $jumlah,
        'jumlah' => $jumlah,
    ]);
}

describe('RapbsApprovalService', function () {

    // =========================================================================
    // Submit
    // =========================================================================
    describe('submit', function () {
        it('submits RAPBS from unit user to Direktur stage', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = Rapbs::factory()->draft()->create([
                'submitted_by' => null,
            ]);

            // Need at least one item for meaningful test — create directly
            createRapbsItem($rapbs);

            $this->service->submit($rapbs, $unitUser);

            $rapbs->refresh();

            expect($rapbs->status)->toBe(RapbsStatus::Submitted)
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Direktur)
                ->and($rapbs->submitted_by)->toBe($unitUser->id);

            // Check approval was created
            expect($rapbs->approvals)->toHaveCount(1);
            $approval = $rapbs->approvals->first();
            expect($approval->stage)->toBe(RapbsApprovalStage::Direktur)
                ->and($approval->status)->toBe('pending');
        });

        it('submits RAPBS from substansi user to Sekretariat stage', function () {
            $substansiUser = User::factory()->substansi()->create();
            $rapbs = Rapbs::factory()->draft()->create();
            createRapbsItem($rapbs);

            $this->service->submit($rapbs, $substansiUser);

            $rapbs->refresh();

            expect($rapbs->status)->toBe(RapbsStatus::Submitted)
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Sekretariat);

            $approval = $rapbs->approvals->first();
            expect($approval->stage)->toBe(RapbsApprovalStage::Sekretariat);
        });
    });

    // =========================================================================
    // Approve
    // =========================================================================
    describe('approve', function () {
        it('approves at Direktur and moves to Keuangan', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur, $unitUser);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->approve($rapbs, $direktur, 'Looks good');

            $rapbs->refresh();

            expect($approval->status)->toBe('approved')
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Keuangan)
                ->and($rapbs->status)->toBe(RapbsStatus::InReview);

            // Check next approval was created
            expect($rapbs->approvals)->toHaveCount(2);
        });

        it('approves at Keuangan and moves to Sekretaris', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Keuangan, $unitUser);
            $keuangan = User::factory()->keuangan()->create();

            $this->service->approve($rapbs, $keuangan);

            $rapbs->refresh();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Sekretaris);
        });

        it('approves at Sekretaris and moves to WakilKetua', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Sekretaris, $unitUser);
            $sekretaris = User::factory()->sekretaris()->create();

            $this->service->approve($rapbs, $sekretaris);

            $rapbs->refresh();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::WakilKetua);
        });

        it('approves at WakilKetua and moves to Ketum', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::WakilKetua, $unitUser);
            $wakilKetua = User::factory()->wakilKetua()->create();

            $this->service->approve($rapbs, $wakilKetua);

            $rapbs->refresh();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Ketum);
        });

        it('approves at Ketum and moves to Bendahara', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Ketum, $unitUser);
            $ketum = User::factory()->ketum()->create();

            $this->service->approve($rapbs, $ketum);

            $rapbs->refresh();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Bendahara);
        });

        it('throws exception when approver has wrong role', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur);
            $kasir = User::factory()->kasir()->create();

            expect(fn () => $this->service->approve($rapbs, $kasir))
                ->toThrow(Exception::class, 'Anda tidak memiliki akses untuk approve stage ini');
        });

        it('allows admin to approve any stage', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur);
            $admin = User::factory()->admin()->create();

            $approval = $this->service->approve($rapbs, $admin);

            expect($approval->status)->toBe('approved');
        });

        it('follows substansi flow: Sekretariat to Keuangan', function () {
            $substansiUser = User::factory()->substansi()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Sekretariat, $substansiUser);
            $sekretariat = User::factory()->sekretariat()->create();

            $this->service->approve($rapbs, $sekretariat);

            $rapbs->refresh();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Keuangan);
        });
    });

    // =========================================================================
    // Final Approval (Bendahara) — APBS Generation
    // =========================================================================
    describe('final approval', function () {
        it('generates APBS when Bendahara approves', function () {
            $unit = Unit::factory()->create();
            $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Bendahara, $unitUser, $unit);

            // Add items with linked DetailMataAnggaran
            $dma1 = DetailMataAnggaran::factory()->withBudget(0)->create();
            $dma2 = DetailMataAnggaran::factory()->withBudget(0)->create();
            createRapbsItem($rapbs, 30_000_000, $dma1);
            createRapbsItem($rapbs, 20_000_000, $dma2);

            $bendahara = User::factory()->bendahara()->create();

            $this->service->approve($rapbs, $bendahara);

            $rapbs->refresh();

            // RAPBS should be Active (after ApbsGenerated transition)
            expect($rapbs->status)->toBe(RapbsStatus::Active)
                ->and($rapbs->current_approval_stage)->toBeNull()
                ->and($rapbs->approved_by)->toBe($bendahara->id);

            // APBS should be created
            $apbs = Apbs::where('rapbs_id', $rapbs->id)->first();
            expect($apbs)->not->toBeNull()
                ->and($apbs->unit_id)->toBe($unit->id)
                ->and($apbs->status)->toBe('active');

            // APBS items should be copied
            $apbsItems = ApbsItem::where('apbs_id', $apbs->id)->get();
            expect($apbsItems)->toHaveCount(2);

            // DetailMataAnggaran should be updated with budget
            $dma1->refresh();
            $dma2->refresh();
            expect((float) $dma1->anggaran_awal)->toBe(30_000_000.00)
                ->and((float) $dma1->balance)->toBe(30_000_000.00)
                ->and((float) $dma2->anggaran_awal)->toBe(20_000_000.00)
                ->and((float) $dma2->balance)->toBe(20_000_000.00);
        });

        it('sets status to Approved then Active after final approval', function () {
            $unitUser = User::factory()->unit()->create();
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Bendahara, $unitUser);
            $bendahara = User::factory()->bendahara()->create();

            $this->service->approve($rapbs, $bendahara);

            $rapbs->refresh();

            // After generateApbs: status transitions through Approved → ApbsGenerated → Active
            expect($rapbs->status)->toBe(RapbsStatus::Active);
        });
    });

    // =========================================================================
    // Full approval flow (end-to-end for unit submitter)
    // =========================================================================
    describe('full approval flow', function () {
        it('completes the full unit approval flow', function () {
            $unit = Unit::factory()->create();
            $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);

            $rapbs = Rapbs::factory()->draft()->create([
                'unit_id' => $unit->id,
                'total_anggaran' => 50_000_000,
            ]);

            $dma = DetailMataAnggaran::factory()->withBudget(0)->create();
            createRapbsItem($rapbs, 50_000_000, $dma);

            // Step 1: Submit
            $this->service->submit($rapbs, $unitUser);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Direktur);

            // Step 2: Direktur approves
            $direktur = User::factory()->direktur()->create();
            $this->service->approve($rapbs->fresh(), $direktur);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Keuangan);

            // Step 3: Keuangan approves
            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($rapbs->fresh(), $keuangan);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Sekretaris);

            // Step 4: Sekretaris approves
            $sekretaris = User::factory()->sekretaris()->create();
            $this->service->approve($rapbs->fresh(), $sekretaris);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::WakilKetua);

            // Step 5: WakilKetua approves
            $wakilKetua = User::factory()->wakilKetua()->create();
            $this->service->approve($rapbs->fresh(), $wakilKetua);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Ketum);

            // Step 6: Ketum approves
            $ketum = User::factory()->ketum()->create();
            $this->service->approve($rapbs->fresh(), $ketum);
            $rapbs->refresh();
            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Bendahara);

            // Step 7: Bendahara approves (final) — APBS generated
            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($rapbs->fresh(), $bendahara);
            $rapbs->refresh();

            expect($rapbs->status)->toBe(RapbsStatus::Active)
                ->and($rapbs->current_approval_stage)->toBeNull();

            // APBS created
            expect(Apbs::where('rapbs_id', $rapbs->id)->exists())->toBeTrue();

            // Total approvals: 6 stages (Direktur→Keuangan→Sekretaris→WakilKetua→Ketum→Bendahara)
            expect($rapbs->approvals)->toHaveCount(6);
        });
    });

    // =========================================================================
    // Revise
    // =========================================================================
    describe('revise', function () {
        it('sends RAPBS back to draft status', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->revise($rapbs, $direktur, 'Please fix the totals');

            $rapbs->refresh();

            expect($approval->status)->toBe('revised')
                ->and($approval->notes)->toBe('Please fix the totals')
                ->and($rapbs->status)->toBe(RapbsStatus::Draft)
                ->and($rapbs->current_approval_stage)->toBeNull();
        });

        it('throws exception when no pending approval exists', function () {
            $rapbs = Rapbs::factory()->draft()->create();
            $direktur = User::factory()->direktur()->create();

            expect(fn () => $this->service->revise($rapbs, $direktur, 'Fix'))
                ->toThrow(Exception::class, 'Tidak ada approval yang pending');
        });
    });

    // =========================================================================
    // Reject
    // =========================================================================
    describe('reject', function () {
        it('rejects RAPBS permanently', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Keuangan);
            $keuangan = User::factory()->keuangan()->create();

            $approval = $this->service->reject($rapbs, $keuangan, 'Budget too high');

            $rapbs->refresh();

            expect($approval->status)->toBe('rejected')
                ->and($rapbs->status)->toBe(RapbsStatus::Rejected)
                ->and($rapbs->current_approval_stage)->toBeNull();
        });
    });

    // =========================================================================
    // getPendingForUser
    // =========================================================================
    describe('getPendingForUser', function () {
        it('returns pending RAPBS for the correct role', function () {
            $direktur = User::factory()->direktur()->create();

            // Create 3 RAPBS at Direktur stage
            for ($i = 0; $i < 3; $i++) {
                createRapbsAtStage(RapbsApprovalStage::Direktur);
            }

            $pending = $this->service->getPendingForUser($direktur);

            expect($pending)->toHaveCount(3);
        });

        it('returns empty for role with no pending', function () {
            $bendahara = User::factory()->bendahara()->create();

            // Create RAPBS at Direktur stage (not Bendahara)
            createRapbsAtStage(RapbsApprovalStage::Direktur);

            $pending = $this->service->getPendingForUser($bendahara);

            expect($pending)->toHaveCount(0);
        });

        it('returns all pending for admin', function () {
            $admin = User::factory()->admin()->create();

            createRapbsAtStage(RapbsApprovalStage::Direktur);
            createRapbsAtStage(RapbsApprovalStage::Keuangan);

            $pending = $this->service->getPendingForUser($admin);

            expect($pending)->toHaveCount(2);
        });
    });

    // =========================================================================
    // canApprove
    // =========================================================================
    describe('canApprove', function () {
        it('returns true when user has correct role for current stage', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            expect($this->service->canApprove($rapbs, $direktur))->toBeTrue();
        });

        it('returns false when user has wrong role', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Direktur);
            $kasir = User::factory()->kasir()->create();

            expect($this->service->canApprove($rapbs, $kasir))->toBeFalse();
        });

        it('returns true for admin at any stage', function () {
            $rapbs = createRapbsAtStage(RapbsApprovalStage::Bendahara);
            $admin = User::factory()->admin()->create();

            expect($this->service->canApprove($rapbs, $admin))->toBeTrue();
        });

        it('returns false when no current approval stage', function () {
            $rapbs = Rapbs::factory()->draft()->create();
            $direktur = User::factory()->direktur()->create();

            expect($this->service->canApprove($rapbs, $direktur))->toBeFalse();
        });
    });
});
