<?php

declare(strict_types=1);

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Models\Apbs;
use App\Models\Rapbs;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Rapbs Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $rapbs = Rapbs::factory()->create([
                'tahun' => '2025',
                'total_anggaran' => 500000000,
                'keterangan' => 'RAPBS Tahun Ajaran 2025/2026',
            ]);

            expect($rapbs->tahun)->toBe('2025')
                ->and((float) $rapbs->total_anggaran)->toBe(500000000.0)
                ->and($rapbs->keterangan)->toBe('RAPBS Tahun Ajaran 2025/2026');
        });

        it('casts status to RapbsStatus enum', function () {
            $rapbs = Rapbs::factory()->draft()->create();

            expect($rapbs->status)->toBeInstanceOf(RapbsStatus::class)
                ->and($rapbs->status)->toBe(RapbsStatus::Draft);
        });

        it('casts current_approval_stage to RapbsApprovalStage enum', function () {
            $rapbs = Rapbs::factory()->submitted()->create();

            expect($rapbs->current_approval_stage)->toBeInstanceOf(RapbsApprovalStage::class);
        });

        it('casts submitted_at and approved_at to datetime', function () {
            $rapbs = Rapbs::factory()->approved()->create();

            expect($rapbs->submitted_at)->toBeInstanceOf(\Carbon\Carbon::class)
                ->and($rapbs->approved_at)->toBeInstanceOf(\Carbon\Carbon::class);
        });
    });

    describe('relationships', function () {
        it('belongs to unit', function () {
            $unit = Unit::factory()->create();
            $rapbs = Rapbs::factory()->create(['unit_id' => $unit->id]);

            expect($rapbs->unit)->toBeInstanceOf(Unit::class)
                ->and($rapbs->unit->id)->toBe($unit->id);
        });

        it('belongs to submitter', function () {
            $user = User::factory()->create();
            $rapbs = Rapbs::factory()->create([
                'submitted_by' => $user->id,
                'submitted_at' => now(),
            ]);

            expect($rapbs->submitter)->toBeInstanceOf(User::class)
                ->and($rapbs->submitter->id)->toBe($user->id);
        });

        it('belongs to approver', function () {
            $user = User::factory()->create();
            $rapbs = Rapbs::factory()->create([
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            expect($rapbs->approver)->toBeInstanceOf(User::class)
                ->and($rapbs->approver->id)->toBe($user->id);
        });

        it('has one apbs', function () {
            $rapbs = Rapbs::factory()->approved()->create();
            $apbs = Apbs::factory()->create(['rapbs_id' => $rapbs->id]);

            expect($rapbs->apbs)->toBeInstanceOf(Apbs::class)
                ->and($rapbs->apbs->id)->toBe($apbs->id);
        });
    });

    describe('helper methods', function () {
        describe('canEdit', function () {
            it('returns true for draft status', function () {
                $rapbs = Rapbs::factory()->draft()->create();
                expect($rapbs->canEdit())->toBeTrue();
            });

            it('returns true for rejected status', function () {
                $rapbs = Rapbs::factory()->rejected()->create();
                expect($rapbs->canEdit())->toBeTrue();
            });

            it('returns false for submitted status', function () {
                $rapbs = Rapbs::factory()->submitted()->create();
                expect($rapbs->canEdit())->toBeFalse();
            });

            it('returns false for approved status', function () {
                $rapbs = Rapbs::factory()->approved()->create();
                expect($rapbs->canEdit())->toBeFalse();
            });
        });

        describe('canSubmit', function () {
            it('returns false for draft without items', function () {
                $rapbs = Rapbs::factory()->draft()->create();
                expect($rapbs->canSubmit())->toBeFalse();
            });

            it('returns false for submitted status', function () {
                $rapbs = Rapbs::factory()->submitted()->create();
                expect($rapbs->canSubmit())->toBeFalse();
            });
        });

        describe('getExpectedFlow', function () {
            it('returns unit flow for unit submitter', function () {
                $unitUser = User::factory()->unit()->create();
                $rapbs = Rapbs::factory()->create([
                    'submitted_by' => $unitUser->id,
                    'submitted_at' => now(),
                ]);

                $flow = $rapbs->getExpectedFlow();

                expect($flow)->toBeArray()
                    ->and($flow[0])->toBe(RapbsApprovalStage::Direktur);
            });
        });
    });

    describe('factory states', function () {
        it('creates draft RAPBS', function () {
            $rapbs = Rapbs::factory()->draft()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Draft)
                ->and($rapbs->current_approval_stage)->toBeNull();
        });

        it('creates submitted RAPBS', function () {
            $rapbs = Rapbs::factory()->submitted()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Submitted)
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Direktur)
                ->and($rapbs->submitted_by)->not->toBeNull()
                ->and($rapbs->submitted_at)->not->toBeNull();
        });

        it('creates verified RAPBS', function () {
            $rapbs = Rapbs::factory()->verified()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Verified)
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Keuangan);
        });

        it('creates in review RAPBS', function () {
            $rapbs = Rapbs::factory()->inReview()->create();

            expect($rapbs->status)->toBe(RapbsStatus::InReview)
                ->and($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Sekretaris);
        });

        it('creates approved RAPBS', function () {
            $rapbs = Rapbs::factory()->approved()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Approved)
                ->and($rapbs->approved_by)->not->toBeNull()
                ->and($rapbs->approved_at)->not->toBeNull();
        });

        it('creates APBS generated RAPBS', function () {
            $rapbs = Rapbs::factory()->apbsGenerated()->create();

            expect($rapbs->status)->toBe(RapbsStatus::ApbsGenerated);
        });

        it('creates active RAPBS', function () {
            $rapbs = Rapbs::factory()->active()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Active);
        });

        it('creates rejected RAPBS', function () {
            $rapbs = Rapbs::factory()->rejected()->create();

            expect($rapbs->status)->toBe(RapbsStatus::Rejected);
        });

        it('creates RAPBS for specific unit', function () {
            $unit = Unit::factory()->create();
            $rapbs = Rapbs::factory()->forUnit($unit)->create();

            expect($rapbs->unit_id)->toBe($unit->id);
        });

        it('creates RAPBS for specific year', function () {
            $rapbs = Rapbs::factory()->forYear('2024')->create();
            expect($rapbs->tahun)->toBe('2024');
        });

        it('creates RAPBS with specific total', function () {
            $rapbs = Rapbs::factory()->withTotal(750000000)->create();
            expect((float) $rapbs->total_anggaran)->toBe(750000000.0);
        });

        it('creates RAPBS at specific stage', function () {
            $rapbs = Rapbs::factory()->atStage(RapbsApprovalStage::Keuangan)->create();

            expect($rapbs->current_approval_stage)->toBe(RapbsApprovalStage::Keuangan);
        });
    });
});
