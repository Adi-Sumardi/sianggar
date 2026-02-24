<?php

declare(strict_types=1);

use App\Enums\AmountCategory;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\Approval;
use App\Models\Attachment;
use App\Models\DetailPengajuan;
use App\Models\Discussion;
use App\Models\FinanceValidation;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PengajuanAnggaran Model', function () {
    describe('factory', function () {
        it('creates a pengajuan with default attributes', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan)->toBeInstanceOf(PengajuanAnggaran::class)
                ->and($pengajuan->nomor_pengajuan)->not->toBeEmpty()
                ->and($pengajuan->perihal)->not->toBeEmpty()
                ->and($pengajuan->status_proses)->toBe(ProposalStatus::Draft);
        });

        it('creates pengajuan with low amount', function () {
            $pengajuan = PengajuanAnggaran::factory()->lowAmount()->create();

            expect((float) $pengajuan->jumlah_pengajuan_total)->toBeLessThan(10_000_000)
                ->and($pengajuan->amount_category)->toBe(AmountCategory::Low);
        });

        it('creates pengajuan with high amount', function () {
            $pengajuan = PengajuanAnggaran::factory()->highAmount()->create();

            expect((float) $pengajuan->jumlah_pengajuan_total)->toBeGreaterThanOrEqual(10_000_000)
                ->and($pengajuan->amount_category)->toBe(AmountCategory::High);
        });

        it('creates submitted pengajuan', function () {
            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Submitted)
                ->and($pengajuan->current_approval_stage)->toBe('staff-direktur');
        });
    });

    describe('relationships', function () {
        it('belongs to a user', function () {
            $user = User::factory()->create();
            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);

            expect($pengajuan->user)->toBeInstanceOf(User::class)
                ->and($pengajuan->user->id)->toBe($user->id);
        });

        it('belongs to a unit', function () {
            $unit = Unit::factory()->create();
            $pengajuan = PengajuanAnggaran::factory()->create(['unit_id' => $unit->id]);

            expect($pengajuan->unitRelation)->toBeInstanceOf(Unit::class)
                ->and($pengajuan->unitRelation->id)->toBe($unit->id);
        });

        it('has many detail pengajuans', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->detailPengajuans)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
        });

        it('has many approvals (polymorphic)', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            Approval::factory()->create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
            ]);

            expect($pengajuan->approvals)->toHaveCount(1);
        });

        it('has many attachments (polymorphic)', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->attachments)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
        });

        it('has one lpj', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->lpj)->toBeNull();
        });

        it('has one finance validation', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->financeValidation)->toBeNull();
        });

        it('has many discussions', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->discussions)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
        });

        it('has many amount edit logs', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();

            expect($pengajuan->amountEditLogs)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
        });
    });

    describe('scopes', function () {
        beforeEach(function () {
            PengajuanAnggaran::factory()->create(['status_proses' => ProposalStatus::Draft->value]);
            PengajuanAnggaran::factory()->create(['status_proses' => ProposalStatus::Draft->value]);
            PengajuanAnggaran::factory()->create(['status_proses' => ProposalStatus::Submitted->value]);
            PengajuanAnggaran::factory()->create(['status_proses' => ProposalStatus::FinalApproved->value]);
        });

        it('filters by status using scopeByStatus', function () {
            $drafts = PengajuanAnggaran::byStatus(ProposalStatus::Draft)->get();
            expect($drafts)->toHaveCount(2);

            $submitted = PengajuanAnggaran::byStatus(ProposalStatus::Submitted)->get();
            expect($submitted)->toHaveCount(1);
        });

        it('filters drafts using scopeDraft', function () {
            $drafts = PengajuanAnggaran::draft()->get();
            expect($drafts)->toHaveCount(2);
        });

        it('filters submitted using scopeSubmitted', function () {
            $submitted = PengajuanAnggaran::submitted()->get();
            expect($submitted)->toHaveCount(1);
        });
    });

    describe('computeAmountCategory', function () {
        it('returns Low for amounts below threshold', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'jumlah_pengajuan_total' => 5_000_000,
            ]);

            expect($pengajuan->computeAmountCategory())->toBe(AmountCategory::Low);
        });

        it('returns High for amounts at or above threshold', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'jumlah_pengajuan_total' => 15_000_000,
            ]);

            expect($pengajuan->computeAmountCategory())->toBe(AmountCategory::High);
        });

        it('returns High for exactly at threshold', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'jumlah_pengajuan_total' => 10_000_000,
            ]);

            expect($pengajuan->computeAmountCategory())->toBe(AmountCategory::High);
        });
    });

    describe('casts', function () {
        it('casts status_proses to ProposalStatus enum', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'status_proses' => ProposalStatus::Submitted->value,
            ]);

            expect($pengajuan->status_proses)->toBe(ProposalStatus::Submitted);
        });

        it('casts amount_category to AmountCategory enum', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'amount_category' => AmountCategory::High->value,
            ]);

            expect($pengajuan->amount_category)->toBe(AmountCategory::High);
        });

        it('casts reference_type to ReferenceType enum', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'reference_type' => ReferenceType::Education->value,
            ]);

            expect($pengajuan->reference_type)->toBe(ReferenceType::Education);
        });

        it('casts need_lpj to boolean', function () {
            $pengajuan = PengajuanAnggaran::factory()->create(['need_lpj' => true]);
            expect($pengajuan->need_lpj)->toBeTrue();

            $pengajuan2 = PengajuanAnggaran::factory()->create(['need_lpj' => false]);
            expect($pengajuan2->need_lpj)->toBeFalse();
        });

        it('casts jumlah_pengajuan_total to decimal', function () {
            $pengajuan = PengajuanAnggaran::factory()->create([
                'jumlah_pengajuan_total' => 1234567.89,
            ]);

            expect($pengajuan->jumlah_pengajuan_total)->toBe('1234567.89');
        });
    });

    describe('fillable attributes', function () {
        it('allows mass assignment of required fields', function () {
            $user = User::factory()->create();
            $unit = Unit::factory()->create();

            $pengajuan = PengajuanAnggaran::create([
                'user_id' => $user->id,
                'unit_id' => $unit->id,
                'unit' => 'SD',
                'tahun' => 2025,
                'nomor_pengajuan' => 'TEST-001',
                'perihal' => 'Test Proposal',
                'nama_pengajuan' => 'Test',
                'jumlah_pengajuan_total' => 5000000,
                'status_proses' => ProposalStatus::Draft->value,
            ]);

            expect($pengajuan->exists)->toBeTrue()
                ->and($pengajuan->nomor_pengajuan)->toBe('TEST-001')
                ->and($pengajuan->perihal)->toBe('Test Proposal');
        });
    });
});
