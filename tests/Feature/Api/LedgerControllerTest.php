<?php

declare(strict_types=1);

use App\Enums\AccountType;
use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);
    Permission::create(['name' => 'view-budget', 'guard_name' => 'web']);
    Permission::create(['name' => 'manage-budget', 'guard_name' => 'web']);
});

describe('Ledger API', function () {
    describe('GET /api/v1/ledger/accounts', function () {
        it('lists accounts', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-budget');

            Account::create([
                'kode' => '5000', 'nama' => 'Beban', 'tipe' => AccountType::Beban->value,
                'saldo_normal' => NormalBalance::Debit->value,
            ]);

            $response = $this->actingAs($user)->getJson('/api/v1/ledger/accounts');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(1);
        });
    });

    describe('POST /api/v1/ledger/accounts', function () {
        it('creates a new account', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-budget');

            $response = $this->actingAs($user)->postJson('/api/v1/ledger/accounts', [
                'kode' => '6000',
                'nama' => 'Akun Test',
                'tipe' => 'beban',
                'saldo_normal' => 'debit',
            ]);

            $response->assertCreated()
                ->assertJsonPath('data.kode', '6000');
        });

        it('returns 403 without manage-budget permission', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-budget');

            $response = $this->actingAs($user)->postJson('/api/v1/ledger/accounts', [
                'kode' => '6000', 'nama' => 'X', 'tipe' => 'beban', 'saldo_normal' => 'debit',
            ]);

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/ledger/journal-entries (manual entry)', function () {
        it('rejects unbalanced entries', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-budget');

            $unit = Unit::factory()->create();
            $kas = Account::create(['kode' => '1900', 'nama' => 'Kas Test', 'tipe' => 'aset', 'saldo_normal' => 'debit']);
            $beban = Account::create(['kode' => '5900', 'nama' => 'Beban Test', 'tipe' => 'beban', 'saldo_normal' => 'debit']);

            $response = $this->actingAs($user)->postJson('/api/v1/ledger/journal-entries', [
                'tanggal' => now()->toDateString(),
                'unit_id' => $unit->id,
                'items' => [
                    ['account_id' => $beban->id, 'unit_id' => $unit->id, 'debit' => 100000, 'kredit' => 0],
                    ['account_id' => $kas->id, 'unit_id' => $unit->id, 'debit' => 0, 'kredit' => 50000],
                ],
            ]);

            $response->assertUnprocessable();
        });

        it('posts a balanced manual entry', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-budget');

            $unit = Unit::factory()->create();
            $kas = Account::create(['kode' => '1901', 'nama' => 'Kas Test', 'tipe' => 'aset', 'saldo_normal' => 'debit']);
            $beban = Account::create(['kode' => '5901', 'nama' => 'Beban Test', 'tipe' => 'beban', 'saldo_normal' => 'debit']);

            $response = $this->actingAs($user)->postJson('/api/v1/ledger/journal-entries', [
                'tanggal' => now()->toDateString(),
                'unit_id' => $unit->id,
                'keterangan' => 'Penyesuaian test',
                'items' => [
                    ['account_id' => $beban->id, 'unit_id' => $unit->id, 'debit' => 100000, 'kredit' => 0],
                    ['account_id' => $kas->id, 'unit_id' => $unit->id, 'debit' => 0, 'kredit' => 100000],
                ],
            ]);

            $response->assertCreated()
                ->assertJsonPath('data.status', 'posted');

            expect($response->json('data.items'))->toHaveCount(2);
        });
    });

    describe('GET /api/v1/ledger/unit-ledger', function () {
        it('computes saldo_awal live from APBS total (anggaran_awal)', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-budget');

            $unit = Unit::factory()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $unit->id, 'tahun' => '2025']);
            $subMataAnggaran = SubMataAnggaran::factory()->create(['mata_anggaran_id' => $mataAnggaran->id]);
            DetailMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
                'sub_mata_anggaran_id' => $subMataAnggaran->id,
                'unit_id' => $unit->id,
                'tahun' => '2025',
                'anggaran_awal' => 5_000_000,
            ]);

            $response = $this->actingAs($user)->getJson("/api/v1/ledger/unit-ledger?unit_id={$unit->id}&tahun=2025");

            $response->assertOk()
                ->assertJsonPath('saldo_awal', 5000000)
                ->assertJsonPath('saldo_akhir', 5000000);
        });
    });

    describe('GET /api/v1/ledger/trial-balance', function () {
        it('returns rows for postable accounts', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-budget');

            Account::create(['kode' => '5950', 'nama' => 'Beban Trial', 'tipe' => 'beban', 'saldo_normal' => 'debit']);

            $response = $this->actingAs($user)->getJson('/api/v1/ledger/trial-balance?tahun=2025');

            $response->assertOk();
            expect($response->json('rows'))->not->toBeEmpty();
        });

        it('accepts academic-year format with a unit filter, for a unit without a pre-seeded Dana account', function () {
            // Regresi: sebelumnya whereYear('tanggal', '2026/2027') dipanggil
            // langsung dengan string tahun akademik (bukan tahun kalender),
            // dan unit yang belum punya baris akun Dana Unit tidak
            // di-provision otomatis di trial-balance/income-statement/
            // balance-sheet (beda dengan unit-ledger yang self-healing).
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-budget');

            $unit = Unit::factory()->create();
            Account::create(['kode' => '5960', 'nama' => 'Beban Trial 2', 'tipe' => 'beban', 'saldo_normal' => 'debit']);

            foreach (['trial-balance', 'income-statement', 'balance-sheet'] as $endpoint) {
                $response = $this->actingAs($user)
                    ->getJson("/api/v1/ledger/{$endpoint}?unit_id={$unit->id}&tahun=2026/2027");

                $response->assertOk();
            }

            expect(Account::where('unit_id', $unit->id)->exists())->toBeTrue();
        });
    });
});
