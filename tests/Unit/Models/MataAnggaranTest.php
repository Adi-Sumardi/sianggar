<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('MataAnggaran Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $unit = Unit::factory()->create();
            $mataAnggaran = MataAnggaran::factory()->create([
                'unit_id' => $unit->id,
                'kode' => '100.01',
                'nama' => 'Biaya Operasional',
                'tahun' => '2025',
                'jenis' => 'pengeluaran',
            ]);

            expect($mataAnggaran->kode)->toBe('100.01')
                ->and($mataAnggaran->nama)->toBe('Biaya Operasional')
                ->and($mataAnggaran->tahun)->toBe('2025')
                ->and($mataAnggaran->jenis)->toBe('pengeluaran');
        });
    });

    describe('relationships', function () {
        it('belongs to unit', function () {
            $unit = Unit::factory()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $unit->id]);

            expect($mataAnggaran->unit)->toBeInstanceOf(Unit::class)
                ->and($mataAnggaran->unit->id)->toBe($unit->id);
        });

        it('has many sub mata anggarans', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            SubMataAnggaran::factory()->count(3)->create([
                'mata_anggaran_id' => $mataAnggaran->id,
            ]);

            expect($mataAnggaran->subMataAnggarans)->toHaveCount(3);
        });

        it('has many detail mata anggarans', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            DetailMataAnggaran::factory()->count(5)->create([
                'mata_anggaran_id' => $mataAnggaran->id,
            ]);

            expect($mataAnggaran->detailMataAnggarans)->toHaveCount(5);
        });
    });

    describe('factory states', function () {
        it('creates pengeluaran type', function () {
            $mataAnggaran = MataAnggaran::factory()->pengeluaran()->create();
            expect($mataAnggaran->jenis)->toBe('pengeluaran');
        });

        it('creates penerimaan type', function () {
            $mataAnggaran = MataAnggaran::factory()->penerimaan()->create();
            expect($mataAnggaran->jenis)->toBe('penerimaan');
        });

        it('creates for specific unit', function () {
            $unit = Unit::factory()->create();
            $mataAnggaran = MataAnggaran::factory()->forUnit($unit)->create();

            expect($mataAnggaran->unit_id)->toBe($unit->id);
        });

        it('creates for specific year', function () {
            $mataAnggaran = MataAnggaran::factory()->forYear('2024')->create();
            expect($mataAnggaran->tahun)->toBe('2024');
        });
    });

    describe('hierarchy', function () {
        it('can have complete hierarchy', function () {
            $unit = Unit::factory()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $unit->id]);

            $subMataAnggaran = SubMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
                'unit_id' => $unit->id,
            ]);

            $detailMataAnggaran = DetailMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
                'sub_mata_anggaran_id' => $subMataAnggaran->id,
                'unit_id' => $unit->id,
            ]);

            expect($mataAnggaran->subMataAnggarans)->toHaveCount(1)
                ->and($mataAnggaran->detailMataAnggarans)->toHaveCount(1)
                ->and($subMataAnggaran->detailMataAnggarans)->toHaveCount(1)
                ->and($detailMataAnggaran->mataAnggaran->id)->toBe($mataAnggaran->id)
                ->and($detailMataAnggaran->subMataAnggaran->id)->toBe($subMataAnggaran->id);
        });
    });
});

describe('SubMataAnggaran Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            $subMataAnggaran = SubMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
                'kode' => '01',
                'nama' => 'Sub Biaya Operasional',
            ]);

            expect($subMataAnggaran->kode)->toBe('01')
                ->and($subMataAnggaran->nama)->toBe('Sub Biaya Operasional');
        });
    });

    describe('relationships', function () {
        it('belongs to mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            $subMataAnggaran = SubMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
            ]);

            expect($subMataAnggaran->mataAnggaran)->toBeInstanceOf(MataAnggaran::class)
                ->and($subMataAnggaran->mataAnggaran->id)->toBe($mataAnggaran->id);
        });

        it('belongs to unit', function () {
            $unit = Unit::factory()->create();
            $subMataAnggaran = SubMataAnggaran::factory()->create(['unit_id' => $unit->id]);

            expect($subMataAnggaran->unit)->toBeInstanceOf(Unit::class)
                ->and($subMataAnggaran->unit->id)->toBe($unit->id);
        });

        it('has many detail mata anggarans', function () {
            $subMataAnggaran = SubMataAnggaran::factory()->create();
            DetailMataAnggaran::factory()->count(3)->create([
                'sub_mata_anggaran_id' => $subMataAnggaran->id,
            ]);

            expect($subMataAnggaran->detailMataAnggarans)->toHaveCount(3);
        });
    });

    describe('factory states', function () {
        it('creates for specific mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            $subMataAnggaran = SubMataAnggaran::factory()
                ->forMataAnggaran($mataAnggaran)
                ->create();

            expect($subMataAnggaran->mata_anggaran_id)->toBe($mataAnggaran->id)
                ->and($subMataAnggaran->unit_id)->toBe($mataAnggaran->unit_id);
        });
    });
});

describe('DetailMataAnggaran Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $detailMataAnggaran = DetailMataAnggaran::factory()->create([
                'kode' => '100.01.001',
                'nama' => 'Kegiatan Operasional',
                'volume' => 1,
                'satuan' => 'paket',
                'harga_satuan' => 5000000,
                'jumlah' => 5000000,
            ]);

            expect($detailMataAnggaran->kode)->toBe('100.01.001')
                ->and($detailMataAnggaran->nama)->toBe('Kegiatan Operasional')
                ->and((float) $detailMataAnggaran->volume)->toBe(1.0)
                ->and($detailMataAnggaran->satuan)->toBe('paket')
                ->and((float) $detailMataAnggaran->harga_satuan)->toBe(5000000.0)
                ->and((float) $detailMataAnggaran->jumlah)->toBe(5000000.0);
        });

        it('has budget tracking fields', function () {
            $detailMataAnggaran = DetailMataAnggaran::factory()->create([
                'anggaran_awal' => 10000000,
                'balance' => 8000000,
                'saldo_dipakai' => 2000000,
                'realisasi_year' => 1500000,
            ]);

            expect((float) $detailMataAnggaran->anggaran_awal)->toBe(10000000.0)
                ->and((float) $detailMataAnggaran->balance)->toBe(8000000.0)
                ->and((float) $detailMataAnggaran->saldo_dipakai)->toBe(2000000.0)
                ->and((float) $detailMataAnggaran->realisasi_year)->toBe(1500000.0);
        });
    });

    describe('relationships', function () {
        it('belongs to mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create();
            $detail = DetailMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
            ]);

            expect($detail->mataAnggaran)->toBeInstanceOf(MataAnggaran::class)
                ->and($detail->mataAnggaran->id)->toBe($mataAnggaran->id);
        });

        it('belongs to sub mata anggaran', function () {
            $subMataAnggaran = SubMataAnggaran::factory()->create();
            $detail = DetailMataAnggaran::factory()->create([
                'sub_mata_anggaran_id' => $subMataAnggaran->id,
            ]);

            expect($detail->subMataAnggaran)->toBeInstanceOf(SubMataAnggaran::class)
                ->and($detail->subMataAnggaran->id)->toBe($subMataAnggaran->id);
        });

        it('belongs to unit', function () {
            $unit = Unit::factory()->create();
            $detail = DetailMataAnggaran::factory()->create(['unit_id' => $unit->id]);

            expect($detail->unit)->toBeInstanceOf(Unit::class)
                ->and($detail->unit->id)->toBe($unit->id);
        });
    });

    describe('factory states', function () {
        it('creates with specific budget', function () {
            $detail = DetailMataAnggaran::factory()->withBudget(25000000)->create();

            expect((float) $detail->harga_satuan)->toBe(25000000.0)
                ->and((float) $detail->jumlah)->toBe(25000000.0)
                ->and((float) $detail->anggaran_awal)->toBe(25000000.0)
                ->and((float) $detail->balance)->toBe(25000000.0);
        });

        it('creates with usage', function () {
            $detail = DetailMataAnggaran::factory()
                ->withBudget(10000000)
                ->withUsage(3000000)
                ->create();

            expect((float) $detail->saldo_dipakai)->toBe(3000000.0)
                ->and((float) $detail->balance)->toBe(7000000.0);
        });

        it('creates with realization', function () {
            $detail = DetailMataAnggaran::factory()
                ->withRealization(5000000)
                ->create();

            expect((float) $detail->realisasi_year)->toBe(5000000.0);
        });

        it('creates for specific year', function () {
            $detail = DetailMataAnggaran::factory()->forYear('2024')->create();
            expect($detail->tahun)->toBe('2024');
        });
    });
});
