<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use App\Models\JenisMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // Create necessary permissions
    Permission::create(['name' => 'manage-budget', 'guard_name' => 'web']);
    Permission::create(['name' => 'view-budget', 'guard_name' => 'web']);

    $this->admin = User::factory()->admin()->create();
    $this->admin->givePermissionTo('manage-budget');
    $this->admin->givePermissionTo('view-budget');

    $this->unit = Unit::factory()->create();
    $this->unitUser = User::factory()->unit()->create(['unit_id' => $this->unit->id]);
    $this->unitUser->givePermissionTo('view-budget');
});

describe('Jenis Mata Anggaran', function () {
    describe('GET /api/v1/jenis-mata-anggarans', function () {
        it('lists jenis mata anggaran', function () {
            JenisMataAnggaran::factory()->count(3)->create();

            $response = $this->actingAs($this->admin)
                ->getJson('/api/v1/jenis-mata-anggarans');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'nama', 'kode'],
                    ],
                ]);
        });
    });

    describe('POST /api/v1/jenis-mata-anggarans', function () {
        it('creates jenis mata anggaran', function () {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/v1/jenis-mata-anggarans', [
                    'nama' => 'Belanja Operasional',
                    'kode' => 'BO',
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.nama', 'Belanja Operasional');
        });
    });

    describe('PUT /api/v1/jenis-mata-anggarans/{id}', function () {
        it('updates jenis mata anggaran', function () {
            $jenis = JenisMataAnggaran::factory()->create();

            $response = $this->actingAs($this->admin)
                ->putJson("/api/v1/jenis-mata-anggarans/{$jenis->id}", [
                    'nama' => 'Updated Name',
                    'kode' => $jenis->kode,
                ]);

            $response->assertOk()
                ->assertJsonPath('data.nama', 'Updated Name');
        });
    });

    describe('DELETE /api/v1/jenis-mata-anggarans/{id}', function () {
        it('deletes jenis mata anggaran', function () {
            $jenis = JenisMataAnggaran::factory()->create();

            $response = $this->actingAs($this->admin)
                ->deleteJson("/api/v1/jenis-mata-anggarans/{$jenis->id}");

            $response->assertOk();
        });
    });
});

describe('Mata Anggaran', function () {
    describe('GET /api/v1/mata-anggarans', function () {
        it('lists mata anggaran for admin', function () {
            MataAnggaran::factory()->count(3)->create(['unit_id' => $this->unit->id]);

            $response = $this->actingAs($this->admin)
                ->getJson('/api/v1/mata-anggarans');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'nama', 'kode'],
                    ],
                ]);
        });

        it('supports search', function () {
            MataAnggaran::factory()->create(['nama' => 'Gaji Guru', 'unit_id' => $this->unit->id]);
            MataAnggaran::factory()->create(['nama' => 'ATK', 'unit_id' => $this->unit->id]);

            $response = $this->actingAs($this->admin)
                ->getJson('/api/v1/mata-anggarans?search=Gaji');

            $response->assertOk();
        });
    });

    describe('POST /api/v1/mata-anggarans', function () {
        it('creates mata anggaran', function () {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/v1/mata-anggarans', [
                    'nama' => 'Gaji Guru',
                    'kode' => 'GG001',
                    'unit_id' => $this->unit->id,
                    'tahun' => '2025',
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.nama', 'Gaji Guru');
        });

        it('validates required fields', function () {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/v1/mata-anggarans', []);

            $response->assertUnprocessable();
        });
    });

    describe('GET /api/v1/mata-anggarans/{id}', function () {
        it('shows mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $this->unit->id]);

            $response = $this->actingAs($this->admin)
                ->getJson("/api/v1/mata-anggarans/{$mataAnggaran->id}");

            $response->assertOk()
                ->assertJsonPath('data.id', $mataAnggaran->id);
        });
    });

    describe('DELETE /api/v1/mata-anggarans/{id}', function () {
        it('deletes mata anggaran', function () {
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $this->unit->id]);

            $response = $this->actingAs($this->admin)
                ->deleteJson("/api/v1/mata-anggarans/{$mataAnggaran->id}");

            $response->assertOk();
        });
    });
});

describe('Sub Mata Anggaran', function () {
    beforeEach(function () {
        $this->mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $this->unit->id]);
    });

    describe('GET /api/v1/mata-anggarans/{id}/sub-mata-anggarans', function () {
        it('lists sub mata anggaran', function () {
            SubMataAnggaran::factory()->count(3)->create([
                'mata_anggaran_id' => $this->mataAnggaran->id,
                'unit_id' => $this->unit->id,
            ]);

            $response = $this->actingAs($this->admin)
                ->getJson("/api/v1/mata-anggarans/{$this->mataAnggaran->id}/sub-mata-anggarans");

            $response->assertOk();
        });
    });

    describe('POST /api/v1/sub-mata-anggarans', function () {
        it('creates sub mata anggaran', function () {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/v1/sub-mata-anggarans', [
                    'nama' => 'Gaji Pokok',
                    'kode' => 'GP001',
                    'mata_anggaran_id' => $this->mataAnggaran->id,
                    'unit_id' => $this->unit->id,
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.nama', 'Gaji Pokok');
        });
    });
});

describe('Detail Mata Anggaran', function () {
    beforeEach(function () {
        $this->mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $this->unit->id]);
        $this->subMataAnggaran = SubMataAnggaran::factory()->create([
            'mata_anggaran_id' => $this->mataAnggaran->id,
            'unit_id' => $this->unit->id,
        ]);
    });

    describe('GET /api/v1/detail-mata-anggarans', function () {
        it('lists detail mata anggaran', function () {
            DetailMataAnggaran::factory()->count(3)->create([
                'mata_anggaran_id' => $this->mataAnggaran->id,
                'sub_mata_anggaran_id' => $this->subMataAnggaran->id,
                'unit_id' => $this->unit->id,
            ]);

            $response = $this->actingAs($this->admin)
                ->getJson('/api/v1/detail-mata-anggarans');

            $response->assertOk();
        });
    });

    describe('POST /api/v1/detail-mata-anggarans', function () {
        it('creates detail mata anggaran', function () {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/v1/detail-mata-anggarans', [
                    'nama' => 'Tunjangan Jabatan',
                    'kode' => 'TJ001',
                    'mata_anggaran_id' => $this->mataAnggaran->id,
                    'sub_mata_anggaran_id' => $this->subMataAnggaran->id,
                    'unit_id' => $this->unit->id,
                    'tahun' => '2025',
                    'volume' => 1,
                    'satuan' => 'paket',
                    'harga_satuan' => 10000000,
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.nama', 'Tunjangan Jabatan');
        });
    });

    describe('POST /api/v1/budget/check-sufficiency', function () {
        it('checks budget sufficiency', function () {
            $detail = DetailMataAnggaran::factory()->create([
                'mata_anggaran_id' => $this->mataAnggaran->id,
                'sub_mata_anggaran_id' => $this->subMataAnggaran->id,
                'unit_id' => $this->unit->id,
                'anggaran_awal' => 10000000,
                'balance' => 5000000,
            ]);

            $response = $this->actingAs($this->unitUser)
                ->postJson('/api/v1/budget/check-sufficiency', [
                    'items' => [
                        [
                            'detail_mata_anggaran_id' => $detail->id,
                            'jumlah' => 3000000,
                        ],
                    ],
                ]);

            $response->assertOk()
                ->assertJsonPath('all_sufficient', true);
        });
    });
});
