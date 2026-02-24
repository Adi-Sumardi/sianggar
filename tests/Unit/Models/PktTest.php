<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\Pkt;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Pkt Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $pkt = Pkt::factory()->create([
                'deskripsi_kegiatan' => 'Kegiatan Pembelajaran',
                'tujuan_kegiatan' => 'Meningkatkan kualitas pembelajaran',
                'saldo_anggaran' => 10000000,
                'volume' => 12,
                'satuan' => 'bulan',
                'tahun' => '2025',
                'status' => 'draft',
            ]);

            expect($pkt->deskripsi_kegiatan)->toBe('Kegiatan Pembelajaran')
                ->and($pkt->tujuan_kegiatan)->toBe('Meningkatkan kualitas pembelajaran')
                ->and((float) $pkt->saldo_anggaran)->toBe(10000000.0)
                ->and((float) $pkt->volume)->toBe(12.0)
                ->and($pkt->satuan)->toBe('bulan')
                ->and($pkt->tahun)->toBe('2025')
                ->and($pkt->status)->toBe('draft');
        });

        it('casts saldo_anggaran to decimal', function () {
            $pkt = Pkt::factory()->create(['saldo_anggaran' => 5500000.50]);

            expect((float) $pkt->saldo_anggaran)->toBe(5500000.50);
        });

        it('casts volume to decimal', function () {
            $pkt = Pkt::factory()->create(['volume' => 2.5]);

            expect((float) $pkt->volume)->toBe(2.50);
        });
    });

    describe('relationships', function () {
        it('belongs to unit relation', function () {
            $unit = Unit::factory()->create();
            $pkt = Pkt::factory()->create(['unit_id' => $unit->id]);

            expect($pkt->unitRelation)->toBeInstanceOf(Unit::class)
                ->and($pkt->unitRelation->id)->toBe($unit->id);
        });

        it('belongs to mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            $pkt = Pkt::factory()->create(['mata_anggaran_id' => $mataAnggaran->id]);

            expect($pkt->mataAnggaran)->toBeInstanceOf(MataAnggaran::class)
                ->and($pkt->mataAnggaran->id)->toBe($mataAnggaran->id);
        });

        it('belongs to sub mata anggaran', function () {
            $subMataAnggaran = SubMataAnggaran::factory()->create();
            $pkt = Pkt::factory()->create(['sub_mata_anggaran_id' => $subMataAnggaran->id]);

            expect($pkt->subMataAnggaran)->toBeInstanceOf(SubMataAnggaran::class)
                ->and($pkt->subMataAnggaran->id)->toBe($subMataAnggaran->id);
        });

        it('belongs to detail mata anggaran', function () {
            $detail = DetailMataAnggaran::factory()->create();
            $pkt = Pkt::factory()->create(['detail_mata_anggaran_id' => $detail->id]);

            expect($pkt->detailMataAnggaran)->toBeInstanceOf(DetailMataAnggaran::class)
                ->and($pkt->detailMataAnggaran->id)->toBe($detail->id);
        });

        it('belongs to creator', function () {
            $user = User::factory()->create();
            $pkt = Pkt::factory()->create(['created_by' => $user->id]);

            expect($pkt->creator)->toBeInstanceOf(User::class)
                ->and($pkt->creator->id)->toBe($user->id);
        });
    });

    describe('helper methods', function () {
        describe('isDraft', function () {
            it('returns true for draft status', function () {
                $pkt = Pkt::factory()->draft()->create();
                expect($pkt->isDraft())->toBeTrue();
            });

            it('returns false for non-draft status', function () {
                $pkt = Pkt::factory()->submitted()->create();
                expect($pkt->isDraft())->toBeFalse();
            });
        });

        describe('isSubmitted', function () {
            it('returns true for submitted status', function () {
                $pkt = Pkt::factory()->submitted()->create();
                expect($pkt->isSubmitted())->toBeTrue();
            });

            it('returns false for non-submitted status', function () {
                $pkt = Pkt::factory()->draft()->create();
                expect($pkt->isSubmitted())->toBeFalse();
            });
        });

        describe('getCoaCode', function () {
            it('returns COA code from mata anggaran hierarchy', function () {
                $mataAnggaran = MataAnggaran::factory()->create(['kode' => '100']);
                $subMataAnggaran = SubMataAnggaran::factory()->create([
                    'mata_anggaran_id' => $mataAnggaran->id,
                    'kode' => '01',
                ]);
                $detail = DetailMataAnggaran::factory()->create([
                    'mata_anggaran_id' => $mataAnggaran->id,
                    'sub_mata_anggaran_id' => $subMataAnggaran->id,
                    'kode' => '001',
                ]);

                $pkt = Pkt::factory()->create([
                    'mata_anggaran_id' => $mataAnggaran->id,
                    'sub_mata_anggaran_id' => $subMataAnggaran->id,
                    'detail_mata_anggaran_id' => $detail->id,
                ]);

                expect($pkt->getCoaCode())->toBe('100.01.001');
            });

            it('returns partial COA code if some levels missing', function () {
                $mataAnggaran = MataAnggaran::factory()->create(['kode' => '200']);

                $pkt = Pkt::factory()->create([
                    'mata_anggaran_id' => $mataAnggaran->id,
                    'sub_mata_anggaran_id' => null,
                    'detail_mata_anggaran_id' => null,
                ]);

                expect($pkt->getCoaCode())->toBe('200');
            });

            it('returns N/A when mata anggaran has no kode', function () {
                $mataAnggaran = MataAnggaran::factory()->create(['kode' => '']);

                $pkt = Pkt::factory()->create([
                    'mata_anggaran_id' => $mataAnggaran->id,
                    'sub_mata_anggaran_id' => null,
                    'detail_mata_anggaran_id' => null,
                ]);

                expect($pkt->getCoaCode())->toBe('N/A');
            });
        });
    });

    describe('factory states', function () {
        it('creates draft PKT', function () {
            $pkt = Pkt::factory()->draft()->create();
            expect($pkt->status)->toBe('draft');
        });

        it('creates submitted PKT', function () {
            $pkt = Pkt::factory()->submitted()->create();
            expect($pkt->status)->toBe('submitted');
        });

        it('creates approved PKT', function () {
            $pkt = Pkt::factory()->approved()->create();
            expect($pkt->status)->toBe('approved');
        });

        it('creates PKT for specific unit', function () {
            $unit = Unit::factory()->create(['nama' => 'SD']);
            $pkt = Pkt::factory()->forUnit($unit)->create();

            expect($pkt->unit_id)->toBe($unit->id)
                ->and($pkt->unit)->toBe('SD');
        });

        it('creates PKT for specific year', function () {
            $pkt = Pkt::factory()->forYear('2024')->create();
            expect($pkt->tahun)->toBe('2024');
        });

        it('creates PKT with specific budget', function () {
            $pkt = Pkt::factory()->withBudget(15000000)->create();
            expect((float) $pkt->saldo_anggaran)->toBe(15000000.0);
        });

        it('creates PKT by specific user', function () {
            $user = User::factory()->create();
            $pkt = Pkt::factory()->createdBy($user)->create();

            expect($pkt->created_by)->toBe($user->id)
                ->and($pkt->unit_id)->toBe($user->unit_id);
        });
    });
});
