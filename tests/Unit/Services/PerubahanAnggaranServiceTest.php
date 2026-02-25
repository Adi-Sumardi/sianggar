<?php

declare(strict_types=1);

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
use App\Services\PerubahanAnggaranService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->service = new PerubahanAnggaranService();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGeserItem(
    PerubahanAnggaran $perubahan,
    float $amount = 5_000_000,
    ?DetailMataAnggaran $source = null,
    ?DetailMataAnggaran $target = null,
): PerubahanAnggaranItem {
    $source ??= DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
    $target ??= DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

    return PerubahanAnggaranItem::create([
        'perubahan_anggaran_id' => $perubahan->id,
        'type' => 'geser',
        'source_detail_mata_anggaran_id' => $source->id,
        'target_detail_mata_anggaran_id' => $target->id,
        'amount' => $amount,
        'keterangan' => 'Test geser item',
    ]);
}

function createTambahItem(
    PerubahanAnggaran $perubahan,
    float $amount = 5_000_000,
    ?DetailMataAnggaran $target = null,
): PerubahanAnggaranItem {
    $target ??= DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

    return PerubahanAnggaranItem::create([
        'perubahan_anggaran_id' => $perubahan->id,
        'type' => 'tambah',
        'source_detail_mata_anggaran_id' => null,
        'target_detail_mata_anggaran_id' => $target->id,
        'amount' => $amount,
        'keterangan' => 'Test tambah item',
    ]);
}

function createPerubahanAtStage(
    ApprovalStage $stage,
    string $submitterType = 'unit',
): PerubahanAnggaran {
    $user = User::factory()->unit()->create();
    $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
    $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

    $perubahan = PerubahanAnggaran::factory()->create([
        'user_id' => $user->id,
        'status' => PerubahanAnggaranStatus::Submitted->value,
        'submitter_type' => $submitterType,
        'current_approval_stage' => $stage->value,
    ]);

    createGeserItem($perubahan, 5_000_000, $source, $target);

    Approval::create([
        'approvable_type' => PerubahanAnggaran::class,
        'approvable_id' => $perubahan->id,
        'stage' => $stage->value,
        'stage_order' => 1,
        'status' => ApprovalStatus::Pending->value,
    ]);

    return $perubahan;
}

describe('PerubahanAnggaranService', function () {

    // =========================================================================
    // Submit
    // =========================================================================
    describe('submit', function () {
        it('submits from unit user to Direktur stage', function () {
            $unitUser = User::factory()->unit()->create();
            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
            ]);
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();
            createGeserItem($perubahan, 5_000_000, $source, $target);

            $this->service->submit($perubahan, $unitUser);

            $perubahan->refresh();

            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Submitted)
                ->and($perubahan->submitter_type)->toBe('unit')
                ->and($perubahan->current_approval_stage)->toBe(ApprovalStage::Direktur);

            // Check approval was created
            expect($perubahan->approvals)->toHaveCount(1);
            $approval = $perubahan->approvals->first();
            expect($approval->stage)->toBe(ApprovalStage::Direktur)
                ->and($approval->status)->toBe(ApprovalStatus::Pending);
        });

        it('submits from substansi user to KabagSekretariat stage', function () {
            $substansiUser = User::factory()->substansi()->create();
            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $substansiUser->id,
            ]);
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();
            createGeserItem($perubahan, 5_000_000, $source, $target);

            $this->service->submit($perubahan, $substansiUser);

            $perubahan->refresh();

            expect($perubahan->submitter_type)->toBe('substansi')
                ->and($perubahan->current_approval_stage)->toBe(ApprovalStage::KabagSekretariat);
        });

        it('throws exception when no items exist', function () {
            $unitUser = User::factory()->unit()->create();
            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
            ]);

            expect(fn () => $this->service->submit($perubahan, $unitUser))
                ->toThrow(RuntimeException::class, 'Minimal harus ada 1 item');
        });

        it('throws exception when source balance is insufficient', function () {
            $unitUser = User::factory()->unit()->create();
            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
            ]);

            $source = DetailMataAnggaran::factory()->withBudget(1_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();
            createGeserItem($perubahan, 5_000_000, $source, $target);

            expect(fn () => $this->service->submit($perubahan, $unitUser))
                ->toThrow(RuntimeException::class, 'Saldo anggaran');
        });

        it('updates total_amount on submit', function () {
            $unitUser = User::factory()->unit()->create();
            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
                'total_amount' => 0,
            ]);
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();
            createGeserItem($perubahan, 3_000_000, $source, $target);
            createGeserItem($perubahan, 2_000_000, $source, $target);

            $this->service->submit($perubahan, $unitUser);

            $perubahan->refresh();

            expect((float) $perubahan->total_amount)->toBe(5_000_000.00);
        });
    });

    // =========================================================================
    // Approve — routing
    // =========================================================================
    describe('approve', function () {
        it('approves at Direktur and moves to WakilKetua', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->approve($perubahan, $direktur, 'OK');

            $perubahan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($perubahan->current_approval_stage)->toBe(ApprovalStage::WakilKetua)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel1);

            expect($perubahan->approvals)->toHaveCount(2);
        });

        it('approves at WakilKetua and moves to Ketum', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::WakilKetua);
            $wakilKetua = User::factory()->wakilKetua()->create();

            $this->service->approve($perubahan, $wakilKetua);

            $perubahan->refresh();

            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Ketum)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel2);
        });

        it('approves at Ketum and moves to Keuangan', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Ketum);
            $ketum = User::factory()->ketum()->create();

            $this->service->approve($perubahan, $ketum);

            $perubahan->refresh();

            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Keuangan)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel3);
        });

        it('approves at Keuangan and moves to Bendahara', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Keuangan);
            $keuangan = User::factory()->keuangan()->create();

            $this->service->approve($perubahan, $keuangan);

            $perubahan->refresh();

            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Bendahara)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel4);
        });

        it('throws exception when approver has wrong role', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Direktur);
            $kasir = User::factory()->kasir()->create();

            expect(fn () => $this->service->approve($perubahan, $kasir))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang');
        });

        it('allows admin to approve any stage', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Direktur);
            $admin = User::factory()->admin()->create();

            $approval = $this->service->approve($perubahan, $admin);

            expect($approval->status)->toBe(ApprovalStatus::Approved);
        });

        it('follows substansi path: KabagSekretariat to Sekretaris', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::KabagSekretariat, 'substansi');
            $sekretariat = User::factory()->sekretariat()->create();

            $this->service->approve($perubahan, $sekretariat);

            $perubahan->refresh();

            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Sekretaris)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel1);
        });

        it('follows substansi path: Sekretaris to Ketum', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Sekretaris, 'substansi');
            $sekretaris = User::factory()->sekretaris()->create();

            $this->service->approve($perubahan, $sekretaris);

            $perubahan->refresh();

            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Ketum)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel2);
        });
    });

    // =========================================================================
    // Final Approval (Bendahara) — executeTransfer
    // =========================================================================
    describe('executeTransfer on final approval', function () {
        it('executes geser transfer: deducts source and adds target', function () {
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => ApprovalStage::Bendahara->value,
            ]);

            createGeserItem($perubahan, 5_000_000, $source, $target);

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Bendahara->value,
                'stage_order' => 5,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($perubahan, $bendahara);

            $perubahan->refresh();
            $source->refresh();
            $target->refresh();

            // Status should be Processed
            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Processed)
                ->and($perubahan->current_approval_stage)->toBeNull()
                ->and($perubahan->processed_by)->toBe($bendahara->id);

            // Source balance should decrease
            expect((float) $source->balance)->toBe(45_000_000.00);

            // Target balance should increase
            expect((float) $target->balance)->toBe(15_000_000.00);
        });

        it('executes tambah transfer: only adds to target', function () {
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => ApprovalStage::Bendahara->value,
            ]);

            createTambahItem($perubahan, 3_000_000, $target);

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Bendahara->value,
                'stage_order' => 5,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($perubahan, $bendahara);

            $target->refresh();

            // Target balance should increase
            expect((float) $target->balance)->toBe(13_000_000.00);
        });

        it('creates audit log for each transfer', function () {
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => ApprovalStage::Bendahara->value,
            ]);

            createGeserItem($perubahan, 5_000_000, $source, $target);

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Bendahara->value,
                'stage_order' => 5,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($perubahan, $bendahara);

            // Check audit log
            $log = PerubahanAnggaranLog::where('perubahan_anggaran_id', $perubahan->id)->first();
            expect($log)->not->toBeNull()
                ->and((float) $log->source_saldo_before)->toBe(50_000_000.00)
                ->and((float) $log->source_saldo_after)->toBe(45_000_000.00)
                ->and((float) $log->target_saldo_before)->toBe(10_000_000.00)
                ->and((float) $log->target_saldo_after)->toBe(15_000_000.00)
                ->and((float) $log->amount)->toBe(5_000_000.00)
                ->and($log->executed_by)->toBe($bendahara->id);
        });

        it('handles multiple items in single transfer', function () {
            $source1 = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target1 = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();
            $source2 = DetailMataAnggaran::factory()->withBudget(30_000_000)->create();
            $target2 = DetailMataAnggaran::factory()->withBudget(5_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => ApprovalStage::Bendahara->value,
            ]);

            createGeserItem($perubahan, 10_000_000, $source1, $target1);
            createGeserItem($perubahan, 8_000_000, $source2, $target2);

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Bendahara->value,
                'stage_order' => 5,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($perubahan, $bendahara);

            $source1->refresh();
            $target1->refresh();
            $source2->refresh();
            $target2->refresh();

            expect((float) $source1->balance)->toBe(40_000_000.00)
                ->and((float) $target1->balance)->toBe(20_000_000.00)
                ->and((float) $source2->balance)->toBe(22_000_000.00)
                ->and((float) $target2->balance)->toBe(13_000_000.00);

            // Two audit logs
            expect(PerubahanAnggaranLog::where('perubahan_anggaran_id', $perubahan->id)->count())->toBe(2);
        });

        it('throws exception when source balance is insufficient during transfer', function () {
            // Source with just enough for item check but we'll drain it
            $source = DetailMataAnggaran::factory()->withBudget(3_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'status' => PerubahanAnggaranStatus::Submitted->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => ApprovalStage::Bendahara->value,
            ]);

            // Item requests more than source has
            createGeserItem($perubahan, 5_000_000, $source, $target);

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Bendahara->value,
                'stage_order' => 5,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $bendahara = User::factory()->bendahara()->create();

            expect(fn () => $this->service->approve($perubahan, $bendahara))
                ->toThrow(RuntimeException::class, 'Saldo anggaran');
        });
    });

    // =========================================================================
    // Full approval flow (end-to-end)
    // =========================================================================
    describe('full approval flow', function () {
        it('completes the full unit approval flow with budget transfer', function () {
            $unitUser = User::factory()->unit()->create();
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
            ]);
            createGeserItem($perubahan, 5_000_000, $source, $target);

            // Step 1: Submit
            $this->service->submit($perubahan, $unitUser);
            $perubahan->refresh();
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Direktur);

            // Step 2: Direktur approves
            $direktur = User::factory()->direktur()->create();
            $this->service->approve($perubahan->fresh(), $direktur);
            $perubahan->refresh();
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::WakilKetua);

            // Step 3: WakilKetua approves
            $wakilKetua = User::factory()->wakilKetua()->create();
            $this->service->approve($perubahan->fresh(), $wakilKetua);
            $perubahan->refresh();
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Ketum);

            // Step 4: Ketum approves
            $ketum = User::factory()->ketum()->create();
            $this->service->approve($perubahan->fresh(), $ketum);
            $perubahan->refresh();
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Keuangan);

            // Step 5: Keuangan approves
            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($perubahan->fresh(), $keuangan);
            $perubahan->refresh();
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Bendahara);

            // Step 6: Bendahara approves (final) — budget transfer executed
            $bendahara = User::factory()->bendahara()->create();
            $this->service->approve($perubahan->fresh(), $bendahara);
            $perubahan->refresh();

            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Processed)
                ->and($perubahan->current_approval_stage)->toBeNull();

            // Budget transferred
            $source->refresh();
            $target->refresh();
            expect((float) $source->balance)->toBe(45_000_000.00)
                ->and((float) $target->balance)->toBe(15_000_000.00);

            // Total 5 approvals (Direktur→WakilKetua→Ketum→Keuangan→Bendahara)
            expect($perubahan->approvals)->toHaveCount(5);

            // Audit log
            expect(PerubahanAnggaranLog::where('perubahan_anggaran_id', $perubahan->id)->count())->toBe(1);
        });
    });

    // =========================================================================
    // Revise
    // =========================================================================
    describe('revise', function () {
        it('sets status to RevisionRequired', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->revise($perubahan, $direktur, 'Fix the amounts');

            $perubahan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->toBe('Fix the amounts')
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::RevisionRequired)
                ->and($perubahan->current_approval_stage)->toBeNull();
        });
    });

    // =========================================================================
    // Resubmit
    // =========================================================================
    describe('resubmit', function () {
        it('resubmits from the beginning after revision', function () {
            $unitUser = User::factory()->unit()->create();
            $source = DetailMataAnggaran::factory()->withBudget(50_000_000)->create();
            $target = DetailMataAnggaran::factory()->withBudget(10_000_000)->create();

            $perubahan = PerubahanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'status' => PerubahanAnggaranStatus::RevisionRequired->value,
                'submitter_type' => 'unit',
                'current_approval_stage' => null,
            ]);
            createGeserItem($perubahan, 5_000_000, $source, $target);

            $this->service->resubmit($perubahan);

            $perubahan->refresh();

            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Submitted)
                ->and($perubahan->current_approval_stage)->toBe(ApprovalStage::Direktur);

            // Previous approvals deleted, new one created
            expect($perubahan->approvals)->toHaveCount(1);
            expect($perubahan->approvals->first()->stage)->toBe(ApprovalStage::Direktur);
        });
    });

    // =========================================================================
    // Reject
    // =========================================================================
    describe('reject', function () {
        it('rejects permanently', function () {
            $perubahan = createPerubahanAtStage(ApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->reject($perubahan, $direktur, 'Not allowed');

            $perubahan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($perubahan->status)->toBe(PerubahanAnggaranStatus::Rejected)
                ->and($perubahan->current_approval_stage)->toBeNull();
        });
    });

    // =========================================================================
    // getNextStage routing
    // =========================================================================
    describe('getNextStage routing', function () {
        it('routes Direktur to WakilKetua', function () {
            $perubahan = PerubahanAnggaran::factory()->create(['submitter_type' => 'unit']);
            expect($this->service->getNextStage($perubahan, ApprovalStage::Direktur))->toBe(ApprovalStage::WakilKetua);
        });

        it('routes WakilKetua to Ketum', function () {
            $perubahan = PerubahanAnggaran::factory()->create();
            expect($this->service->getNextStage($perubahan, ApprovalStage::WakilKetua))->toBe(ApprovalStage::Ketum);
        });

        it('routes KabagSekretariat to Sekretaris', function () {
            $perubahan = PerubahanAnggaran::factory()->create(['submitter_type' => 'substansi']);
            expect($this->service->getNextStage($perubahan, ApprovalStage::KabagSekretariat))->toBe(ApprovalStage::Sekretaris);
        });

        it('routes Sekretaris to Ketum', function () {
            $perubahan = PerubahanAnggaran::factory()->create();
            expect($this->service->getNextStage($perubahan, ApprovalStage::Sekretaris))->toBe(ApprovalStage::Ketum);
        });

        it('routes Ketum to Keuangan', function () {
            $perubahan = PerubahanAnggaran::factory()->create();
            expect($this->service->getNextStage($perubahan, ApprovalStage::Ketum))->toBe(ApprovalStage::Keuangan);
        });

        it('routes Keuangan to Bendahara', function () {
            $perubahan = PerubahanAnggaran::factory()->create();
            expect($this->service->getNextStage($perubahan, ApprovalStage::Keuangan))->toBe(ApprovalStage::Bendahara);
        });

        it('returns null after Bendahara (end of workflow)', function () {
            $perubahan = PerubahanAnggaran::factory()->create();
            expect($this->service->getNextStage($perubahan, ApprovalStage::Bendahara))->toBeNull();
        });
    });

    // =========================================================================
    // getPendingForRole
    // =========================================================================
    describe('getPendingForRole', function () {
        it('returns pending for correct role', function () {
            $direktur = User::factory()->direktur()->create();

            for ($i = 0; $i < 3; $i++) {
                createPerubahanAtStage(ApprovalStage::Direktur);
            }

            $pending = $this->service->getPendingForRole($direktur);

            expect($pending)->toHaveCount(3);
        });

        it('returns empty for role with no pending', function () {
            $bendahara = User::factory()->bendahara()->create();
            createPerubahanAtStage(ApprovalStage::Direktur);

            $pending = $this->service->getPendingForRole($bendahara);

            expect($pending)->toHaveCount(0);
        });
    });
});
