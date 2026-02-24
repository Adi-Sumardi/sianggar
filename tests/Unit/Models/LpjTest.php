<?php

declare(strict_types=1);

use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Lpj Model', function () {
    describe('factory', function () {
        it('creates an LPJ with default attributes', function () {
            $lpj = Lpj::factory()->create();

            expect($lpj)->toBeInstanceOf(Lpj::class)
                ->and($lpj->no_surat)->not->toBeEmpty()
                ->and($lpj->perihal)->not->toBeEmpty()
                ->and($lpj->proses)->toBe(LpjStatus::Draft);
        });

        it('creates draft LPJ', function () {
            $lpj = Lpj::factory()->draft()->create();

            expect($lpj->proses)->toBe(LpjStatus::Draft)
                ->and($lpj->current_approval_stage)->toBeNull();
        });

        it('creates submitted LPJ', function () {
            $lpj = Lpj::factory()->submitted()->create();

            expect($lpj->proses)->toBe(LpjStatus::Submitted)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);
        });

        it('creates validated LPJ', function () {
            $lpj = Lpj::factory()->validated()->create();

            expect($lpj->proses)->toBe(LpjStatus::Validated)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur)
                ->and($lpj->reference_type)->toBe(ReferenceType::Education);
        });

        it('creates approved LPJ', function () {
            $lpj = Lpj::factory()->approved()->create();

            expect($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('relationships', function () {
        it('belongs to a pengajuan anggaran', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->create(['pengajuan_anggaran_id' => $pengajuan->id]);

            expect($lpj->pengajuanAnggaran)->toBeInstanceOf(PengajuanAnggaran::class)
                ->and($lpj->pengajuanAnggaran->id)->toBe($pengajuan->id);
        });

        it('has many approvals (polymorphic)', function () {
            $lpj = Lpj::factory()->create();
            Approval::factory()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
            ]);

            expect($lpj->approvals)->toHaveCount(1);
        });

        it('has many attachments (polymorphic)', function () {
            $lpj = Lpj::factory()->create();

            expect($lpj->attachments)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
        });

        it('has one validation', function () {
            $lpj = Lpj::factory()->create();

            expect($lpj->validation)->toBeNull();
        });
    });

    describe('scopes', function () {
        beforeEach(function () {
            Lpj::factory()->create(['proses' => LpjStatus::Draft->value]);
            Lpj::factory()->create(['proses' => LpjStatus::Draft->value]);
            Lpj::factory()->create(['proses' => LpjStatus::Submitted->value]);
            Lpj::factory()->create(['proses' => LpjStatus::Approved->value]);
            Lpj::factory()->create(['proses' => LpjStatus::Validated->value]);
        });

        it('filters by status using scopeByStatus', function () {
            $drafts = Lpj::byStatus(LpjStatus::Draft)->get();
            expect($drafts)->toHaveCount(2);

            $submitted = Lpj::byStatus(LpjStatus::Submitted)->get();
            expect($submitted)->toHaveCount(1);
        });

        it('filters drafts using scopeDraft', function () {
            $drafts = Lpj::draft()->get();
            expect($drafts)->toHaveCount(2);
        });

        it('filters submitted using scopeSubmitted', function () {
            $submitted = Lpj::submitted()->get();
            expect($submitted)->toHaveCount(1);
        });

        it('filters approved using scopeApproved', function () {
            $approved = Lpj::approved()->get();
            expect($approved)->toHaveCount(1);
        });

        it('filters pending approval using scopePendingApproval', function () {
            $pending = Lpj::pendingApproval()->get();
            expect($pending)->toHaveCount(2); // Submitted + Validated
        });
    });

    describe('getExpectedStages', function () {
        it('returns stages starting with StaffKeuangan', function () {
            $lpj = Lpj::factory()->create();
            $stages = $lpj->getExpectedStages();

            expect($stages[0])->toBe(LpjApprovalStage::StaffKeuangan);
        });

        it('includes middle approver when reference_type is set', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Education->value]);
            $stages = $lpj->getExpectedStages();

            expect($stages)->toContain(LpjApprovalStage::StaffKeuangan)
                ->and($stages)->toContain(LpjApprovalStage::Direktur)
                ->and($stages)->toContain(LpjApprovalStage::Keuangan);
        });

        it('includes KabagSdmUmum for HrGeneral reference type', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::HrGeneral->value]);
            $stages = $lpj->getExpectedStages();

            expect($stages)->toContain(LpjApprovalStage::KabagSdmUmum);
        });

        it('includes KabagSekretariat for Secretariat reference type', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Secretariat->value]);
            $stages = $lpj->getExpectedStages();

            expect($stages)->toContain(LpjApprovalStage::KabagSekretariat);
        });

        it('always ends with Keuangan', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Education->value]);
            $stages = $lpj->getExpectedStages();

            expect(end($stages))->toBe(LpjApprovalStage::Keuangan);
        });
    });

    describe('canBeEdited', function () {
        it('returns true for draft LPJ', function () {
            $lpj = Lpj::factory()->draft()->create();
            expect($lpj->canBeEdited())->toBeTrue();
        });

        it('returns true for revised LPJ', function () {
            $lpj = Lpj::factory()->revised()->create();
            expect($lpj->canBeEdited())->toBeTrue();
        });

        it('returns false for submitted LPJ', function () {
            $lpj = Lpj::factory()->submitted()->create();
            expect($lpj->canBeEdited())->toBeFalse();
        });

        it('returns false for approved LPJ', function () {
            $lpj = Lpj::factory()->approved()->create();
            expect($lpj->canBeEdited())->toBeFalse();
        });
    });

    describe('isFinal', function () {
        it('returns true for approved LPJ', function () {
            $lpj = Lpj::factory()->approved()->create();
            expect($lpj->isFinal())->toBeTrue();
        });

        it('returns true for rejected LPJ', function () {
            $lpj = Lpj::factory()->rejected()->create();
            expect($lpj->isFinal())->toBeTrue();
        });

        it('returns false for draft LPJ', function () {
            $lpj = Lpj::factory()->draft()->create();
            expect($lpj->isFinal())->toBeFalse();
        });

        it('returns false for submitted LPJ', function () {
            $lpj = Lpj::factory()->submitted()->create();
            expect($lpj->isFinal())->toBeFalse();
        });
    });

    describe('casts', function () {
        it('casts proses to LpjStatus enum', function () {
            $lpj = Lpj::factory()->create(['proses' => LpjStatus::Submitted->value]);
            expect($lpj->proses)->toBe(LpjStatus::Submitted);
        });

        it('casts current_approval_stage to LpjApprovalStage enum', function () {
            $lpj = Lpj::factory()->create([
                'current_approval_stage' => LpjApprovalStage::StaffKeuangan->value,
            ]);
            expect($lpj->current_approval_stage)->toBe(LpjApprovalStage::StaffKeuangan);
        });

        it('casts reference_type to ReferenceType enum', function () {
            $lpj = Lpj::factory()->create(['reference_type' => ReferenceType::Education->value]);
            expect($lpj->reference_type)->toBe(ReferenceType::Education);
        });

        it('casts jumlah_pengajuan_total to decimal', function () {
            $lpj = Lpj::factory()->create(['jumlah_pengajuan_total' => 1234567.89]);
            expect($lpj->jumlah_pengajuan_total)->toBe('1234567.89');
        });

        it('casts input_realisasi to decimal', function () {
            $lpj = Lpj::factory()->create(['input_realisasi' => 1000000.50]);
            expect($lpj->input_realisasi)->toBe('1000000.50');
        });
    });
});
