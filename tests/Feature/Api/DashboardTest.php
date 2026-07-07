<?php

declare(strict_types=1);

use App\Enums\ProposalStatus;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-dashboard', 'guard_name' => 'web']);
});

describe('Dashboard API', function () {
    describe('GET /api/v1/dashboard/stats', function () {
        it('returns dashboard statistics for admin', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-dashboard');

            // Create some test data
            PengajuanAnggaran::factory()->draft()->count(5)->create();
            PengajuanAnggaran::factory()->submitted()->count(3)->create();
            PengajuanAnggaran::factory()->approved()->count(2)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/dashboard/stats');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'type',
                        'stats',
                    ],
                ]);
        });

        it('returns role-specific stats for unit user', function () {
            $unitUser = User::factory()->unit('sd')->create();
            $unitUser->givePermissionTo('view-dashboard');

            // Create pengajuan for this user
            PengajuanAnggaran::factory()->count(3)->create(['user_id' => $unitUser->id]);

            // Create pengajuan for other users (should not be included)
            PengajuanAnggaran::factory()->count(5)->create();

            $response = $this->actingAs($unitUser)
                ->getJson('/api/v1/dashboard/stats');

            $response->assertOk();
        });

        it('treats non-approver substansi role (mis. Yta/Laz) as unit dashboard, not approver', function () {
            // Substansi non-approver (Asrama/Laz/Litbang/Stebank/SDM/Umum/Yta) harus
            // dapat dashboard type "unit" (lihat unit sendiri saja), BUKAN "approver"
            // (yang sebelumnya bocor karena fallback default dashboardType()).
            $substansiUser = User::factory()->substansi('asrama')->create([
                'unit_id' => \App\Models\Unit::factory()->create()->id,
            ]);
            $substansiUser->givePermissionTo('view-dashboard');

            $response = $this->actingAs($substansiUser)
                ->getJson('/api/v1/dashboard/stats');

            $response->assertOk()
                ->assertJsonPath('data.type', 'unit');
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/dashboard/stats');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/dashboard/stats');

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/dashboard/charts', function () {
        it('returns chart data', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-dashboard');

            PengajuanAnggaran::factory()->count(10)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/dashboard/charts');

            $response->assertOk()
                ->assertJsonStructure([
                    'data',
                ]);
        });
    });

    describe('GET /api/v1/dashboard/recent-pengajuan', function () {
        it('returns recent pengajuan list', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-dashboard');

            PengajuanAnggaran::factory()->count(15)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/dashboard/recent-pengajuan');

            $response->assertOk()
                ->assertJsonStructure([
                    'data',
                ]);

            // Should limit to recent items
            expect(count($response->json('data')))->toBeLessThanOrEqual(10);
        });

        it('only shows own unit pengajuan for substansi non-approver role', function () {
            $ownUnit = \App\Models\Unit::factory()->create();
            $otherUnit = \App\Models\Unit::factory()->create();

            $substansiUser = User::factory()->substansi('laz')->create([
                'unit_id' => $ownUnit->id,
            ]);
            $substansiUser->givePermissionTo('view-dashboard');

            PengajuanAnggaran::factory()->count(2)->create(['unit_id' => $ownUnit->id]);
            PengajuanAnggaran::factory()->count(3)->create(['unit_id' => $otherUnit->id]);

            $response = $this->actingAs($substansiUser)
                ->getJson('/api/v1/dashboard/recent-pengajuan');

            $response->assertOk();
            $data = $response->json('data');

            expect(count($data))->toBe(2);
            foreach ($data as $item) {
                expect($item['unit'])->toBe($ownUnit->nama);
            }
        });
    });

    describe('GET /api/v1/dashboard/status-distribution', function () {
        it('returns status distribution', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-dashboard');

            PengajuanAnggaran::factory()->draft()->count(5)->create();
            PengajuanAnggaran::factory()->submitted()->count(3)->create();
            PengajuanAnggaran::factory()->approved()->count(7)->create();
            PengajuanAnggaran::factory()->rejected()->count(2)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/dashboard/status-distribution');

            $response->assertOk()
                ->assertJsonStructure([
                    'data',
                ]);
        });
    });
});
