<?php

declare(strict_types=1);

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\ApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->service = new ApprovalService();
});

describe('ApprovalService', function () {
    describe('submit', function () {
        it('submits a proposal from unit user to StaffDirektur stage', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $pengajuan = PengajuanAnggaran::factory()->draft()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            $this->service->submit($pengajuan, $unitUser);

            $pengajuan->refresh();

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Submitted)
                ->and($pengajuan->submitter_type)->toBe('unit')
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffDirektur->value)
                ->and($pengajuan->amount_category)->toBe(AmountCategory::Low);

            // Check approval record was created
            expect($pengajuan->approvals)->toHaveCount(1);
            $approval = $pengajuan->approvals->first();
            expect($approval->stage)->toBe(ApprovalStage::StaffDirektur)
                ->and($approval->status)->toBe(ApprovalStatus::Pending)
                ->and($approval->stage_order)->toBe(1);
        });

        it('submits a proposal from substansi user to StaffKeuangan stage', function () {
            $substansiUser = User::factory()->substansi('asrama')->create();
            $pengajuan = PengajuanAnggaran::factory()->draft()->create([
                'user_id' => $substansiUser->id,
                'jumlah_pengajuan_total' => 15_000_000,
            ]);

            $this->service->submit($pengajuan, $substansiUser);

            $pengajuan->refresh();

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Submitted)
                ->and($pengajuan->submitter_type)->toBe('substansi')
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value)
                ->and($pengajuan->amount_category)->toBe(AmountCategory::High);
        });

        it('sets correct amount category for low amounts', function () {
            $user = User::factory()->unit()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $user->id,
                'jumlah_pengajuan_total' => 9_999_999,
            ]);

            $this->service->submit($pengajuan, $user);
            $pengajuan->refresh();

            expect($pengajuan->amount_category)->toBe(AmountCategory::Low);
        });

        it('sets correct amount category for high amounts', function () {
            $user = User::factory()->unit()->create();
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $user->id,
                'jumlah_pengajuan_total' => 10_000_000,
            ]);

            $this->service->submit($pengajuan, $user);
            $pengajuan->refresh();

            expect($pengajuan->amount_category)->toBe(AmountCategory::High);
        });
    });

    describe('approve', function () {
        it('approves at StaffDirektur and moves to StaffKeuangan', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'jumlah_pengajuan_total' => 5_000_000,
            ]);
            $this->service->submit($pengajuan, $unitUser);

            $approval = $this->service->approve($pengajuan->fresh(), $staffDirektur, 'Approved');

            $pengajuan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Approved)
                ->and($approval->approved_by)->toBe($staffDirektur->id)
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffKeuangan->value);

            // Check next approval was created
            expect($pengajuan->approvals)->toHaveCount(2);
        });

        it('throws exception when approver has wrong role', function () {
            $unitUser = User::factory()->unit()->create();
            $wrongUser = User::factory()->kasir()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);

            expect(fn () => $this->service->approve($pengajuan->fresh(), $wrongUser))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki wewenang');
        });

        it('allows admin to approve any stage', function () {
            $unitUser = User::factory()->unit()->create();
            $admin = User::factory()->admin()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);

            $approval = $this->service->approve($pengajuan->fresh(), $admin);

            expect($approval->status)->toBe(ApprovalStatus::Approved);
        });

        it('generates voucher number when Bendahara approves', function () {
            $pengajuan = createPengajuanAtStage(ApprovalStage::Bendahara);
            $bendahara = User::factory()->bendahara()->create();

            $this->service->approve($pengajuan, $bendahara);
            $pengajuan->refresh();

            expect($pengajuan->no_voucher)->not->toBeNull()
                ->and($pengajuan->no_voucher)->toMatch('/\d{3}\/\d{2}\/\d{4}/');
        });
    });

    describe('approveWithValidation', function () {
        it('stores finance validation data at StaffKeuangan stage', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);
            $this->service->approve($pengajuan->fresh(), $staffDirektur);

            $validationData = [
                'valid_document' => true,
                'valid_calculation' => true,
                'valid_budget_code' => true,
                'reasonable_cost' => true,
                'reasonable_volume' => true,
                'reasonable_executor' => true,
                'reference_type' => ReferenceType::Education->value,
                'need_lpj' => true,
            ];

            $this->service->approveWithValidation(
                $pengajuan->fresh(),
                $staffKeuangan,
                $validationData,
                'Validated'
            );

            $pengajuan->refresh();

            expect($pengajuan->reference_type)->toBe(ReferenceType::Education)
                ->and($pengajuan->need_lpj)->toBeTrue()
                ->and($pengajuan->financeValidation)->not->toBeNull()
                ->and($pengajuan->financeValidation->valid_document)->toBeTrue();
        });

        it('throws exception when not at StaffKeuangan stage', function () {
            $unitUser = User::factory()->unit()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);

            expect(fn () => $this->service->approveWithValidation(
                $pengajuan->fresh(),
                $staffKeuangan,
                ['reference_type' => ReferenceType::Education->value]
            ))->toThrow(RuntimeException::class, 'Validasi hanya dapat dilakukan pada tahap Staf Keuangan');
        });
    });

    describe('revise', function () {
        it('sets proposal status to RevisionRequired', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);

            $approval = $this->service->revise($pengajuan->fresh(), $staffDirektur, 'Please fix the budget');

            $pengajuan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Revised)
                ->and($approval->notes)->toBe('Please fix the budget')
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::RevisionRequired)
                ->and($pengajuan->revision_requested_stage)->toBe(ApprovalStage::StaffDirektur->value)
                ->and($pengajuan->current_approval_stage)->toBeNull();
        });
    });

    describe('resubmit', function () {
        it('resubmits to the stage that requested revision', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);
            $this->service->revise($pengajuan->fresh(), $staffDirektur, 'Fix this');

            $this->service->resubmit($pengajuan->fresh());

            $pengajuan->refresh();

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Revised)
                ->and($pengajuan->current_approval_stage)->toBe(ApprovalStage::StaffDirektur->value)
                ->and($pengajuan->revision_requested_stage)->toBeNull();
        });
    });

    describe('reject', function () {
        it('sets proposal status to Rejected', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
            $this->service->submit($pengajuan, $unitUser);

            $approval = $this->service->reject($pengajuan->fresh(), $staffDirektur, 'Rejected due to policy');

            $pengajuan->refresh();

            expect($approval->status)->toBe(ApprovalStatus::Rejected)
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::Rejected)
                ->and($pengajuan->current_approval_stage)->toBeNull();
        });
    });

    describe('editAmount', function () {
        it('allows amount editing at Keuangan stage', function () {
            $pengajuan = createPengajuanAtStage(ApprovalStage::Keuangan);
            $keuangan = User::factory()->keuangan()->create();

            $originalAmount = $pengajuan->jumlah_pengajuan_total;
            $newAmount = 8_000_000;

            $log = $this->service->editAmount($pengajuan, $keuangan, $newAmount, 'Adjusted for market price');

            $pengajuan->refresh();

            expect($pengajuan->approved_amount)->toBe(number_format($newAmount, 2, '.', ''))
                ->and((float) $log->original_amount)->toBe((float) $originalAmount)
                ->and((float) $log->new_amount)->toBe((float) $newAmount)
                ->and($log->reason)->toBe('Adjusted for market price');
        });

        it('allows amount editing at Bendahara stage', function () {
            $pengajuan = createPengajuanAtStage(ApprovalStage::Bendahara);
            $bendahara = User::factory()->bendahara()->create();

            $log = $this->service->editAmount($pengajuan, $bendahara, 7_500_000);

            expect($log)->not->toBeNull();
        });

        it('throws exception when editing at wrong stage', function () {
            $pengajuan = createPengajuanAtStage(ApprovalStage::Direktur);
            $direktur = User::factory()->direktur()->create();

            expect(fn () => $this->service->editAmount($pengajuan, $direktur, 5_000_000))
                ->toThrow(RuntimeException::class, 'Edit nominal hanya diizinkan pada tahap Keuangan dan Bendahara');
        });
    });

    describe('getNextStage routing', function () {
        it('routes StaffDirektur to StaffKeuangan', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::StaffDirektur);

            expect($next)->toBe(ApprovalStage::StaffKeuangan);
        });

        it('routes StaffKeuangan to Direktur for Education reference', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'reference_type' => ReferenceType::Education->value,
            ]);
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::StaffKeuangan);

            expect($next)->toBe(ApprovalStage::Direktur);
        });

        it('routes StaffKeuangan to KabagSdmUmum for HrGeneral reference', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'reference_type' => ReferenceType::HrGeneral->value,
            ]);
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::StaffKeuangan);

            expect($next)->toBe(ApprovalStage::KabagSdmUmum);
        });

        it('routes StaffKeuangan to KabagSekretariat for Secretariat reference', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'reference_type' => ReferenceType::Secretariat->value,
            ]);
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::StaffKeuangan);

            expect($next)->toBe(ApprovalStage::KabagSekretariat);
        });

        it('routes Direktur to WakilKetua for high amount', function () {
            $pengajuan = PengajuanAnggaran::factory()->highAmount()->create([
                'reference_type' => ReferenceType::Education->value,
            ]);
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Direktur);

            expect($next)->toBe(ApprovalStage::WakilKetua);
        });

        it('routes Direktur to Keuangan for low amount', function () {
            $pengajuan = PengajuanAnggaran::factory()->lowAmount()->create([
                'reference_type' => ReferenceType::Education->value,
            ]);
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Direktur);

            expect($next)->toBe(ApprovalStage::Keuangan);
        });

        it('routes WakilKetua to Ketum', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::WakilKetua);

            expect($next)->toBe(ApprovalStage::Ketum);
        });

        it('routes Sekretaris to Ketum', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Sekretaris);

            expect($next)->toBe(ApprovalStage::Ketum);
        });

        it('routes Ketum to Keuangan', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Ketum);

            expect($next)->toBe(ApprovalStage::Keuangan);
        });

        it('routes Keuangan to Bendahara', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Keuangan);

            expect($next)->toBe(ApprovalStage::Bendahara);
        });

        it('routes Bendahara to Kasir', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Bendahara);

            expect($next)->toBe(ApprovalStage::Kasir);
        });

        it('routes Kasir to Payment', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Kasir);

            expect($next)->toBe(ApprovalStage::Payment);
        });

        it('returns null after Payment (end of workflow)', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $next = $this->service->getNextStage($pengajuan, ApprovalStage::Payment);

            expect($next)->toBeNull();
        });
    });

    describe('getPendingForRole', function () {
        it('returns pending approvals for user role', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            // Create 3 proposals
            for ($i = 0; $i < 3; $i++) {
                $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
                $this->service->submit($pengajuan, $unitUser);
            }

            $pending = $this->service->getPendingForRole($staffDirektur);

            expect($pending)->toHaveCount(3);
        });

        it('returns empty collection for role with no pending approvals', function () {
            $keuangan = User::factory()->keuangan()->create();

            $pending = $this->service->getPendingForRole($keuangan);

            expect($pending)->toHaveCount(0);
        });
    });

    describe('countPendingForRole', function () {
        it('counts pending approvals for user role', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();

            for ($i = 0; $i < 5; $i++) {
                $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id]);
                $this->service->submit($pengajuan, $unitUser);
            }

            $count = $this->service->countPendingForRole($staffDirektur);

            expect($count)->toBe(5);
        });
    });

    describe('openDiscussion', function () {
        it('allows Ketum to open discussion', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $ketum = User::factory()->ketum()->create();

            $discussion = $this->service->openDiscussion($pengajuan, $ketum);

            expect($discussion->status)->toBe('open')
                ->and($discussion->opened_by)->toBe($ketum->id);
        });

        it('throws exception for unauthorized user', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();

            expect(fn () => $this->service->openDiscussion($pengajuan, $staffKeuangan))
                ->toThrow(RuntimeException::class, 'Anda tidak memiliki akses untuk membuka diskusi');
        });

        it('throws exception if discussion already open', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $ketum = User::factory()->ketum()->create();

            $this->service->openDiscussion($pengajuan, $ketum);

            expect(fn () => $this->service->openDiscussion($pengajuan->fresh(), $ketum))
                ->toThrow(RuntimeException::class, 'Diskusi sudah terbuka');
        });
    });

    describe('closeDiscussion', function () {
        it('allows opener to close discussion', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $ketum = User::factory()->ketum()->create();

            $this->service->openDiscussion($pengajuan, $ketum);
            $discussion = $this->service->closeDiscussion($pengajuan->fresh(), $ketum);

            expect($discussion->status)->toBe('closed')
                ->and($discussion->closed_by)->toBe($ketum->id);
        });

        it('throws exception when non-opener tries to close', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $ketum = User::factory()->ketum()->create();
            $sekretaris = User::factory()->sekretaris()->create();

            $this->service->openDiscussion($pengajuan, $ketum);

            expect(fn () => $this->service->closeDiscussion($pengajuan->fresh(), $sekretaris))
                ->toThrow(RuntimeException::class, 'Hanya yang membuka diskusi yang dapat menutup');
        });
    });

    describe('markAsPaid', function () {
        it('marks proposal as paid and updates payment details', function () {
            $pengajuan = createPengajuanAtStage(ApprovalStage::Payment);
            $payment = User::factory()->payment()->create();

            $this->service->markAsPaid(
                $pengajuan,
                $payment,
                'John Doe',
                'Transfer Bank',
                'Transferred to BCA account'
            );

            $pengajuan->refresh();

            expect($pengajuan->status_payment)->toBe('paid')
                ->and($pengajuan->payment_recipient)->toBe('John Doe')
                ->and($pengajuan->payment_method)->toBe('Transfer Bank')
                ->and($pengajuan->payment_notes)->toBe('Transferred to BCA account')
                ->and($pengajuan->paid_by)->toBe($payment->id);
        });
    });
});

// Helper function to create pengajuan at specific stage
function createPengajuanAtStage(ApprovalStage $stage): PengajuanAnggaran
{
    $pengajuan = PengajuanAnggaran::factory()->create([
        'status_proses' => ProposalStatus::Submitted->value,
        'current_approval_stage' => $stage->value,
        'reference_type' => ReferenceType::Education->value,
        'amount_category' => AmountCategory::Low->value,
    ]);

    Approval::factory()->pending()->create([
        'approvable_type' => PengajuanAnggaran::class,
        'approvable_id' => $pengajuan->id,
        'stage' => $stage->value,
    ]);

    return $pengajuan;
}
