<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Models\Apbs;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();

    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (\App\Enums\UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->service = new LpjApprovalService();
});

describe('LpjApprovalService', function () {
    describe('submit', function () {
        it('submits LPJ to StaffKeuangan stage', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);
            $submitter = User::factory()->unit()->create();

            $this->service->submit($lpj, $submitter);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);

            // Check approval was created
            expect($lpj->approvals)->toHaveCount(1);
            $approval = $lpj->approvals->first();
            expect($approval->stage)->toBe(ApprovalStage::StaffKeuangan)
                ->and($approval->status)->toBe(ApprovalStatus::Pending);
        });
    });

    describe('validate', function () {
        it('validates LPJ with checklist at StaffKeuangan stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
                'notes' => 'All documents verified',
            ];

            $validation = $this->service->validate($lpj, $staffKeuangan, $validationData);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Validated)
                ->and($lpj->reference_type)->toBe(ReferenceType::Education)
                ->and($lpj->validated_by)->toBe($staffKeuangan->id)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur);

            expect($validation->has_activity_identity)->toBeTrue()
                ->and($validation->reference_type)->toBe(ReferenceType::Education);
        });

        it('throws exception when checklist is incomplete', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => false, // Missing
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $staffKeuangan, $validationData))
                ->toThrow(RuntimeException::class, 'Semua item checklist harus dicentang');
        });

        it('throws exception when not at StaffKeuangan stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $staffKeuangan, $validationData))
                ->toThrow(RuntimeException::class, 'Validasi hanya dapat dilakukan pada tahap Staf Keuangan');
        });

        it('throws exception when validator has wrong role', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            $wrongUser = User::factory()->kasir()->create();

            $validationData = [
                'has_activity_identity' => true,
                'has_cover_letter' => true,
                'has_narrative_report' => true,
                'has_financial_report' => true,
                'has_receipts' => true,
                'reference_type' => ReferenceType::Education->value,
            ];

            expect(fn () => $this->service->validate($lpj, $wrongUser, $validationData))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang untuk validasi LPJ');
        });
    });

    describe('approve', function () {
        it('approves at Direktur stage and moves to Keuangan', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->approve($lpj, $direktur, 'Approved');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($lpj->proses)->toBe(LpjStatus::ApprovedByMiddle)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);
        });

        it('approves at Keuangan stage (final approval)', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Keuangan);
            $lpj->update(['proses' => LpjStatus::ApprovedByMiddle->value]);
            $keuangan = User::factory()->keuangan()->create();

            $approval = $this->service->approve($lpj, $keuangan, 'Final approval');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->current_approval_stage)->toBeNull();
        });

        it('throws exception when approver has wrong role', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $wrongUser = User::factory()->kasir()->create();

            expect(fn () => $this->service->approve($lpj, $wrongUser))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang');
        });

        it('allows admin to approve any stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $admin = User::factory()->admin()->create();

            $approval = $this->service->approve($lpj, $admin);

            expect($approval->status)->toBe(ApprovalStatus::Approved);
        });
    });

    describe('revise', function () {
        it('requests revision and saves revision stage', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->revise($lpj, $direktur, 'Please add more details');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->toBe('Please add more details')
                ->and($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->revision_requested_stage)->toBe(LpjApprovalStage::Direktur->value)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('resubmit', function () {
        it('resubmits to the stage that requested revision', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $this->service->revise($lpj, $direktur, 'Fix this');

            $lpj->refresh();
            $this->service->resubmit($lpj);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur)
                ->and($lpj->revision_requested_stage)->toBeNull();
        });

        it('resubmits from start when no revision stage recorded', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Revised->value,
                'revision_requested_stage' => null,
            ]);

            $this->service->resubmit($lpj);

            $lpj->refresh();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);
        });
    });

    describe('reject', function () {
        it('rejects LPJ permanently', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            $approval = $this->service->reject($lpj, $direktur, 'Insufficient documentation');

            $lpj->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($lpj->proses)->toBe(LpjStatus::Rejected)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('getNextStage routing', function () {
        it('routes StaffKeuangan to Direktur for Education reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Education->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::Direktur);
        });

        it('routes StaffKeuangan to KabagSdmUmum for HrGeneral reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::HrGeneral->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::KabagSdmUmum);
        });

        it('routes StaffKeuangan to KabagSekretariat for Secretariat reference', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Secretariat->value]);
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan);

            expect($next)->toBe(LpjApprovalStage::KabagSekretariat);
        });

        it('routes all middle approvers to Keuangan', function () {
            $lpj = Lpj::factory()->create();

            expect($this->service->getNextStage($lpj, LpjApprovalStage::Direktur))->toBe(LpjApprovalStage::Keuangan);
            expect($this->service->getNextStage($lpj, LpjApprovalStage::KabagSdmUmum))->toBe(LpjApprovalStage::Keuangan);
            expect($this->service->getNextStage($lpj, LpjApprovalStage::KabagSekretariat))->toBe(LpjApprovalStage::Keuangan);
        });

        it('returns null after Keuangan (end of workflow)', function () {
            $lpj = Lpj::factory()->create();
            $next = $this->service->getNextStage($lpj, LpjApprovalStage::Keuangan);

            expect($next)->toBeNull();
        });

        it('throws exception when reference_type is not set', function () {
            $lpj = Lpj::factory()->create(['reference_type' => null]);

            expect(fn () => $this->service->getNextStage($lpj, LpjApprovalStage::StaffKeuangan))
                ->toThrow(RuntimeException::class, 'Rujukan LPJ belum ditentukan');
        });
    });

    describe('getExpectedStages', function () {
        it('returns correct stages for Education reference', function () {
            $lpj = Lpj::factory()->validated()->create();
            $stages = $this->service->getExpectedStages($lpj);

            expect($stages)->toHaveCount(3);
            expect($stages[0]['stage'])->toBe(LpjApprovalStage::StaffKeuangan->value);
            expect($stages[1]['stage'])->toBe(LpjApprovalStage::Direktur->value);
            expect($stages[2]['stage'])->toBe(LpjApprovalStage::Keuangan->value);
        });

        it('returns correct stages for HrGeneral reference', function () {
            $lpj = Lpj::factory()->create([
                'proses' => LpjStatus::Validated->value,
                'current_approval_stage' => LpjApprovalStage::KabagSdmUmum->value,
                'reference_type' => ReferenceType::HrGeneral->value,
                'validated_at' => now(),
            ]);

            $stages = $this->service->getExpectedStages($lpj);

            expect($stages[1]['stage'])->toBe(LpjApprovalStage::KabagSdmUmum->value);
        });
    });

    describe('getPendingForRole', function () {
        it('returns pending LPJ approvals for user role', function () {
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            // Create 3 LPJs at StaffKeuangan stage
            for ($i = 0; $i < 3; $i++) {
                createLpjAtStage(LpjApprovalStage::StaffKeuangan);
            }

            $pending = $this->service->getPendingForRole($staffKeuangan);

            expect($pending)->toHaveCount(3);
        });

        it('returns empty collection for role with no pending LPJs', function () {
            $keuangan = User::factory()->keuangan()->create();

            $pending = $this->service->getPendingForRole($keuangan);

            expect($pending)->toHaveCount(0);
        });
    });

    describe('getCurrentStageApproval', function () {
        it('returns current pending approval', function () {
            $lpj = createLpjAtStage(LpjApprovalStage::StaffKeuangan);

            $approval = $this->service->getCurrentStageApproval($lpj);

            expect($approval)->not->toBeNull()
                ->and($approval->stage)->toBe(ApprovalStage::StaffKeuangan)
                ->and($approval->status)->toBe(ApprovalStatus::Pending);
        });

        it('returns null when no pending approval', function () {
            $lpj = Lpj::factory()->approved()->create();

            $approval = $this->service->getCurrentStageApproval($lpj);

            expect($approval)->toBeNull();
        });
    });

    describe('getApprovalTimeline', function () {
        it('returns all approvals in order', function () {
            $lpj = Lpj::factory()->create();

            Approval::factory()->approved()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::StaffKeuangan->value,
                'stage_order' => 1,
            ]);

            Approval::factory()->approved()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
                'stage_order' => 2,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $timeline = $this->service->getApprovalTimeline($lpj);

            expect($timeline)->toHaveCount(3)
                ->and($timeline[0]->stage_order)->toBe(1)
                ->and($timeline[1]->stage_order)->toBe(2)
                ->and($timeline[2]->stage_order)->toBe(3);
        });
    });

    describe('releaseUnusedBudget (via final approval)', function () {
        it('returns unused budget proportionally to DetailMataAnggaran', function () {
            // Setup: 2 budget lines with reserved amounts
            $dma1 = DetailMataAnggaran::factory()->withBudget(20000000)->create([
                'saldo_dipakai' => 6000000,
                'balance' => 14000000,
            ]);
            $dma2 = DetailMataAnggaran::factory()->withBudget(15000000)->create([
                'saldo_dipakai' => 4000000,
                'balance' => 11000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create([
                'unit_id' => $dma1->unit_id,
            ]);

            // Detail items: 6M (60%) and 4M (40%) = 10M total reserved
            createDetailPengajuan($pengajuan, $dma1, 6000000, 'Item A');
            createDetailPengajuan($pengajuan, $dma2, 4000000, 'Item B');

            // LPJ with realisasi = 7.5M (savings = 2.5M)
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 10000000,
                'input_realisasi' => 7500000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Final approval');

            // Savings = 10M - 7.5M = 2.5M
            // DMA1: 2.5M × 60% = 1.5M returned → saldo_dipakai: 6M - 1.5M = 4.5M
            // DMA2: 2.5M × 40% = 1.0M returned → saldo_dipakai: 4M - 1.0M = 3.0M
            $dma1->refresh();
            $dma2->refresh();

            expect((float) $dma1->saldo_dipakai)->toBe(4500000.0)
                ->and((float) $dma1->balance)->toBe(15500000.0) // 20M - 4.5M
                ->and((float) $dma2->saldo_dipakai)->toBe(3000000.0)
                ->and((float) $dma2->balance)->toBe(12000000.0); // 15M - 3.0M

            $lpj->refresh();
            expect($lpj->budget_released)->toBeTrue();
        });

        it('does not return budget when input_realisasi equals total reserved', function () {
            $dma = DetailMataAnggaran::factory()->withBudget(10000000)->create([
                'saldo_dipakai' => 5000000,
                'balance' => 5000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create([
                'unit_id' => $dma->unit_id,
            ]);

            createDetailPengajuan($pengajuan, $dma, 5000000, 'Item A');

            // Realisasi = reserved amount (no savings)
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 5000000,
                'input_realisasi' => 5000000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Approved');

            $dma->refresh();

            // No change to budget
            expect((float) $dma->saldo_dipakai)->toBe(5000000.0)
                ->and((float) $dma->balance)->toBe(5000000.0);

            $lpj->refresh();
            expect($lpj->budget_released)->toBeTrue();
        });

        it('does not return budget when input_realisasi exceeds total reserved (overspent)', function () {
            $dma = DetailMataAnggaran::factory()->withBudget(10000000)->create([
                'saldo_dipakai' => 5000000,
                'balance' => 5000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create([
                'unit_id' => $dma->unit_id,
            ]);

            createDetailPengajuan($pengajuan, $dma, 5000000, 'Item A');

            // Overspent: realisasi > reserved
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 5000000,
                'input_realisasi' => 6000000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Approved');

            $dma->refresh();

            // No change to budget (overspent is ignored)
            expect((float) $dma->saldo_dipakai)->toBe(5000000.0)
                ->and((float) $dma->balance)->toBe(5000000.0);

            $lpj->refresh();
            expect($lpj->budget_released)->toBeTrue();
        });

        it('prevents double budget release via budget_released flag', function () {
            $dma = DetailMataAnggaran::factory()->withBudget(10000000)->create([
                'saldo_dipakai' => 5000000,
                'balance' => 5000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create([
                'unit_id' => $dma->unit_id,
            ]);

            createDetailPengajuan($pengajuan, $dma, 5000000, 'Item A');

            // Already released
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 5000000,
                'input_realisasi' => 3000000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => true, // Already released
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Approved');

            $dma->refresh();

            // Budget should NOT change (double release guarded)
            expect((float) $dma->saldo_dipakai)->toBe(5000000.0)
                ->and((float) $dma->balance)->toBe(5000000.0);
        });

        it('updates APBS total_realisasi when LPJ is approved', function () {
            $unit = \App\Models\Unit::factory()->create();

            $dma = DetailMataAnggaran::factory()->withBudget(20000000)->forUnit($unit)->create([
                'saldo_dipakai' => 10000000,
                'balance' => 10000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create([
                'unit_id' => $unit->id,
            ]);

            createDetailPengajuan($pengajuan, $dma, 10000000, 'Item A');

            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 10000000,
                'input_realisasi' => 7500000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            // Create APBS for same unit and year
            $apbs = Apbs::factory()->forUnit($unit)->active()->create([
                'tahun' => $lpj->tahun,
                'total_anggaran' => 100000000,
                'total_realisasi' => 0,
                'sisa_anggaran' => 100000000,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Approved');

            $apbs->refresh();

            // APBS realisasi should increase by input_realisasi (7.5M)
            expect((float) $apbs->total_realisasi)->toBe(7500000.0)
                ->and((float) $apbs->sisa_anggaran)->toBe(92500000.0);
        });

        it('handles pengajuan with no detail items gracefully', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            // No DetailPengajuan created

            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 5000000,
                'input_realisasi' => 3000000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();

            // Should not throw, just skip budget release
            $approval = $this->service->approve($lpj, $keuangan, 'Approved');

            expect($approval->status)->toBe(ApprovalStatus::Approved);

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->budget_released)->toBeFalse();
        });

        it('distributes proportionally across 3 budget lines', function () {
            $dma1 = DetailMataAnggaran::factory()->withBudget(50000000)->create([
                'saldo_dipakai' => 5000000,
                'balance' => 45000000,
            ]);
            $dma2 = DetailMataAnggaran::factory()->withBudget(30000000)->create([
                'saldo_dipakai' => 3000000,
                'balance' => 27000000,
            ]);
            $dma3 = DetailMataAnggaran::factory()->withBudget(20000000)->create([
                'saldo_dipakai' => 2000000,
                'balance' => 18000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create();

            // Items: 5M (50%), 3M (30%), 2M (20%) = 10M total
            createDetailPengajuan($pengajuan, $dma1, 5000000, 'Item A');
            createDetailPengajuan($pengajuan, $dma2, 3000000, 'Item B');
            createDetailPengajuan($pengajuan, $dma3, 2000000, 'Item C');

            // Realisasi = 6M → savings = 4M
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 10000000,
                'input_realisasi' => 6000000,
                'proses' => LpjStatus::ApprovedByMiddle->value,
                'current_approval_stage' => LpjApprovalStage::Keuangan->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
                'stage_order' => 3,
            ]);

            $keuangan = User::factory()->keuangan()->create();
            $this->service->approve($lpj, $keuangan, 'Final');

            // Savings = 4M
            // DMA1: 4M × 50% = 2M returned → saldo_dipakai: 5M - 2M = 3M
            // DMA2: 4M × 30% = 1.2M returned → saldo_dipakai: 3M - 1.2M = 1.8M
            // DMA3: 4M × 20% = 0.8M returned → saldo_dipakai: 2M - 0.8M = 1.2M
            $dma1->refresh();
            $dma2->refresh();
            $dma3->refresh();

            expect((float) $dma1->saldo_dipakai)->toBe(3000000.0)
                ->and((float) $dma1->balance)->toBe(47000000.0)
                ->and((float) $dma2->saldo_dipakai)->toBe(1800000.0)
                ->and((float) $dma2->balance)->toBe(28200000.0)
                ->and((float) $dma3->saldo_dipakai)->toBe(1200000.0)
                ->and((float) $dma3->balance)->toBe(18800000.0);

            $lpj->refresh();
            expect($lpj->budget_released)->toBeTrue();
        });

        it('does not release budget on non-final (middle) approval', function () {
            $dma = DetailMataAnggaran::factory()->withBudget(10000000)->create([
                'saldo_dipakai' => 5000000,
                'balance' => 5000000,
            ]);

            $pengajuan = PengajuanAnggaran::factory()->create();

            createDetailPengajuan($pengajuan, $dma, 5000000, 'Item A');

            // LPJ at Direktur stage (middle, not final)
            $lpj = Lpj::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'jumlah_pengajuan_total' => 5000000,
                'input_realisasi' => 3000000,
                'proses' => LpjStatus::Validated->value,
                'current_approval_stage' => LpjApprovalStage::Direktur->value,
                'reference_type' => ReferenceType::Education->value,
                'budget_released' => false,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
                'stage_order' => 2,
            ]);

            $direktur = User::factory()->direktur()->create();
            $this->service->approve($lpj, $direktur, 'Approved by Direktur');

            $dma->refresh();

            // Budget should NOT change (not final stage)
            expect((float) $dma->saldo_dipakai)->toBe(5000000.0)
                ->and((float) $dma->balance)->toBe(5000000.0);

            $lpj->refresh();
            expect($lpj->budget_released)->toBeFalse();
        });
    });
});

// Helper function to create a DetailPengajuan with required fields
function createDetailPengajuan(
    PengajuanAnggaran $pengajuan,
    DetailMataAnggaran $dma,
    float $jumlah,
    string $uraian = 'Item',
): DetailPengajuan {
    return DetailPengajuan::create([
        'pengajuan_anggaran_id' => $pengajuan->id,
        'detail_mata_anggaran_id' => $dma->id,
        'mata_anggaran_id' => $dma->mata_anggaran_id,
        'uraian' => $uraian,
        'volume' => 1,
        'satuan' => 'paket',
        'harga_satuan' => $jumlah,
        'jumlah' => $jumlah,
    ]);
}

// Helper function to create LPJ at specific stage
function createLpjAtStage(LpjApprovalStage $stage): Lpj
{
    $pengajuan = PengajuanAnggaran::factory()->create();

    $status = match ($stage) {
        LpjApprovalStage::StaffKeuangan => LpjStatus::Submitted,
        LpjApprovalStage::Direktur, LpjApprovalStage::KabagSdmUmum, LpjApprovalStage::KabagSekretariat => LpjStatus::Validated,
        LpjApprovalStage::Keuangan => LpjStatus::ApprovedByMiddle,
    };

    $lpj = Lpj::factory()->create([
        'pengajuan_anggaran_id' => $pengajuan->id,
        'proses' => $status->value,
        'current_approval_stage' => $stage->value,
        'reference_type' => ReferenceType::Education->value,
    ]);

    Approval::factory()->pending()->create([
        'approvable_type' => Lpj::class,
        'approvable_id' => $lpj->id,
        'stage' => $stage->value,
    ]);

    return $lpj;
}
