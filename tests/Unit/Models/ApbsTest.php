<?php

declare(strict_types=1);

use App\Models\Apbs;
use App\Models\Rapbs;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Apbs Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $apbs = Apbs::factory()->create([
                'tahun' => '2025',
                'total_anggaran' => 500000000,
                'total_realisasi' => 250000000,
                'sisa_anggaran' => 250000000,
                'nomor_dokumen' => 'APBS-001/2025',
                'status' => 'active',
            ]);

            expect($apbs->tahun)->toBe('2025')
                ->and((float) $apbs->total_anggaran)->toBe(500000000.0)
                ->and((float) $apbs->total_realisasi)->toBe(250000000.0)
                ->and((float) $apbs->sisa_anggaran)->toBe(250000000.0)
                ->and($apbs->nomor_dokumen)->toBe('APBS-001/2025')
                ->and($apbs->status)->toBe('active');
        });

        it('casts tanggal_pengesahan to date', function () {
            $apbs = Apbs::factory()->create([
                'tanggal_pengesahan' => '2025-01-15',
            ]);

            expect($apbs->tanggal_pengesahan)->toBeInstanceOf(\Carbon\Carbon::class)
                ->and($apbs->tanggal_pengesahan->format('Y-m-d'))->toBe('2025-01-15');
        });

        it('casts monetary values to decimal', function () {
            $apbs = Apbs::factory()->create([
                'total_anggaran' => 123456789.12,
                'total_realisasi' => 12345678.90,
                'sisa_anggaran' => 111111110.22,
            ]);

            expect((float) $apbs->total_anggaran)->toBe(123456789.12)
                ->and((float) $apbs->total_realisasi)->toBe(12345678.90)
                ->and((float) $apbs->sisa_anggaran)->toBe(111111110.22);
        });
    });

    describe('relationships', function () {
        it('belongs to unit', function () {
            $unit = Unit::factory()->create();
            $apbs = Apbs::factory()->create(['unit_id' => $unit->id]);

            expect($apbs->unit)->toBeInstanceOf(Unit::class)
                ->and($apbs->unit->id)->toBe($unit->id);
        });

        it('belongs to rapbs', function () {
            $rapbs = Rapbs::factory()->approved()->create();
            $apbs = Apbs::factory()->create(['rapbs_id' => $rapbs->id]);

            expect($apbs->rapbs)->toBeInstanceOf(Rapbs::class)
                ->and($apbs->rapbs->id)->toBe($rapbs->id);
        });
    });

    describe('helper methods', function () {
        describe('isActive', function () {
            it('returns true for active status', function () {
                $apbs = Apbs::factory()->active()->create();
                expect($apbs->isActive())->toBeTrue();
            });

            it('returns false for non-active status', function () {
                $apbs = Apbs::factory()->closed()->create();
                expect($apbs->isActive())->toBeFalse();
            });
        });

        describe('isClosed', function () {
            it('returns true for closed status', function () {
                $apbs = Apbs::factory()->closed()->create();
                expect($apbs->isClosed())->toBeTrue();
            });

            it('returns false for non-closed status', function () {
                $apbs = Apbs::factory()->active()->create();
                expect($apbs->isClosed())->toBeFalse();
            });
        });

        describe('getRealisasiPercentage', function () {
            it('returns correct percentage', function () {
                $apbs = Apbs::factory()->create([
                    'total_anggaran' => 100000000,
                    'total_realisasi' => 75000000,
                ]);

                expect($apbs->getRealisasiPercentage())->toBe(75.0);
            });

            it('returns 0 when total anggaran is 0', function () {
                $apbs = Apbs::factory()->create([
                    'total_anggaran' => 0,
                    'total_realisasi' => 0,
                ]);

                expect($apbs->getRealisasiPercentage())->toBe(0.0);
            });

            it('returns 100 for full realization', function () {
                $apbs = Apbs::factory()->fullyRealized()->create();

                expect($apbs->getRealisasiPercentage())->toBe(100.0);
            });

            it('returns 0 for no realization', function () {
                $apbs = Apbs::factory()->noRealization()->create();

                expect($apbs->getRealisasiPercentage())->toBe(0.0);
            });
        });
    });

    describe('factory states', function () {
        it('creates active APBS', function () {
            $apbs = Apbs::factory()->active()->create();
            expect($apbs->status)->toBe('active');
        });

        it('creates closed APBS', function () {
            $apbs = Apbs::factory()->closed()->create();
            expect($apbs->status)->toBe('closed');
        });

        it('creates pending APBS', function () {
            $apbs = Apbs::factory()->pending()->create();

            expect($apbs->status)->toBe('pending')
                ->and((float) $apbs->total_realisasi)->toBe(0.0);
        });

        it('creates APBS for specific unit', function () {
            $unit = Unit::factory()->create();
            $apbs = Apbs::factory()->forUnit($unit)->create();

            expect($apbs->unit_id)->toBe($unit->id);
        });

        it('creates APBS from specific RAPBS', function () {
            $rapbs = Rapbs::factory()->approved()->create();
            $apbs = Apbs::factory()->fromRapbs($rapbs)->create();

            expect($apbs->rapbs_id)->toBe($rapbs->id)
                ->and($apbs->unit_id)->toBe($rapbs->unit_id)
                ->and($apbs->tahun)->toBe($rapbs->tahun);
        });

        it('creates APBS for specific year', function () {
            $apbs = Apbs::factory()->forYear('2024')->create();
            expect($apbs->tahun)->toBe('2024');
        });

        it('creates APBS with specific budget', function () {
            $apbs = Apbs::factory()->withBudget(800000000, 400000000)->create();

            expect((float) $apbs->total_anggaran)->toBe(800000000.0)
                ->and((float) $apbs->total_realisasi)->toBe(400000000.0)
                ->and((float) $apbs->sisa_anggaran)->toBe(400000000.0);
        });

        it('creates fully realized APBS', function () {
            $apbs = Apbs::factory()->fullyRealized()->create();

            expect((float) $apbs->total_realisasi)->toBe((float) $apbs->total_anggaran)
                ->and((float) $apbs->sisa_anggaran)->toBe(0.0);
        });

        it('creates APBS with no realization', function () {
            $apbs = Apbs::factory()->noRealization()->create();

            expect((float) $apbs->total_realisasi)->toBe(0.0)
                ->and((float) $apbs->sisa_anggaran)->toBe((float) $apbs->total_anggaran);
        });

        it('creates APBS with specific realization percent', function () {
            $apbs = Apbs::factory()
                ->withBudget(100000000, 0)
                ->withRealizationPercent(60)
                ->create();

            expect((float) $apbs->total_realisasi)->toBe(60000000.0)
                ->and((float) $apbs->sisa_anggaran)->toBe(40000000.0);
        });

        it('creates signed APBS', function () {
            $apbs = Apbs::factory()->signed()->create();

            expect($apbs->ttd_kepala_sekolah)->toBe('signed')
                ->and($apbs->ttd_bendahara)->toBe('signed')
                ->and($apbs->ttd_ketua_umum)->toBe('signed');
        });
    });

    describe('budget calculations', function () {
        it('sisa_anggaran equals total_anggaran minus total_realisasi', function () {
            $apbs = Apbs::factory()->create([
                'total_anggaran' => 500000000,
                'total_realisasi' => 350000000,
                'sisa_anggaran' => 150000000,
            ]);

            $expectedSisa = (float) $apbs->total_anggaran - (float) $apbs->total_realisasi;
            expect((float) $apbs->sisa_anggaran)->toBe($expectedSisa);
        });

        it('handles zero budget correctly', function () {
            $apbs = Apbs::factory()->create([
                'total_anggaran' => 0,
                'total_realisasi' => 0,
                'sisa_anggaran' => 0,
            ]);

            expect((float) $apbs->total_anggaran)->toBe(0.0)
                ->and((float) $apbs->total_realisasi)->toBe(0.0)
                ->and((float) $apbs->sisa_anggaran)->toBe(0.0);
        });
    });
});
