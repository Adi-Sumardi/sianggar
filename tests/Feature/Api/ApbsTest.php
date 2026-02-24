<?php

declare(strict_types=1);

use App\Models\Apbs;
use App\Models\Rapbs;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-budget', 'guard_name' => 'web']);
    Permission::create(['name' => 'manage-budget', 'guard_name' => 'web']);
});

describe('APBS API', function () {
    describe('GET /api/v1/apbs', function () {
        it('returns list of APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-budget');

            Apbs::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/apbs');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'tahun',
                            'total_anggaran',
                            'total_realisasi',
                            'sisa_anggaran',
                            'status',
                        ],
                    ],
                ]);
        });

        it('filters by unit for unit user', function () {
            $unit = Unit::factory()->create();
            $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $unitUser->givePermissionTo('view-budget');

            Apbs::factory()->forUnit($unit)->count(3)->create();
            Apbs::factory()->count(2)->create();

            $response = $this->actingAs($unitUser)
                ->getJson('/api/v1/apbs');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(3);
        });

        it('filters by year', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-budget');

            Apbs::factory()->forYear('2024')->count(2)->create();
            Apbs::factory()->forYear('2025')->count(4)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/apbs?tahun=2025');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(4);
        });

        it('filters by status', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-budget');

            Apbs::factory()->active()->count(3)->create();
            Apbs::factory()->closed()->count(2)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/apbs?status=active');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(3);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/apbs');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/apbs');

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/apbs/{id}', function () {
        it('returns APBS details', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-budget');

            $apbs = Apbs::factory()->create();

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/apbs/{$apbs->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'tahun',
                        'total_anggaran',
                        'total_realisasi',
                        'sisa_anggaran',
                        'nomor_dokumen',
                        'status',
                        'unit',
                        'rapbs',
                    ],
                ])
                ->assertJsonPath('data.id', $apbs->id);
        });

        it('returns 404 for non-existent APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-budget');

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/apbs/999999');

            $response->assertNotFound();
        });
    });

    describe('POST /api/v1/apbs', function () {
        it('creates APBS from approved RAPBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $rapbs = Rapbs::factory()->approved()->create();

            $data = [
                'rapbs_id' => $rapbs->id,
                'nomor_dokumen' => 'APBS-001/2025',
                'tanggal_pengesahan' => '2025-01-15',
            ];

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/apbs', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'tahun',
                        'total_anggaran',
                        'nomor_dokumen',
                        'status',
                    ],
                ])
                ->assertJsonPath('data.nomor_dokumen', 'APBS-001/2025');
        });

        it('validates required fields', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/apbs', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['rapbs_id']);
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $rapbs = Rapbs::factory()->approved()->create();

            $response = $this->actingAs($user)
                ->postJson('/api/v1/apbs', [
                    'rapbs_id' => $rapbs->id,
                ]);

            $response->assertForbidden();
        });
    });

    describe('PUT /api/v1/apbs/{id}', function () {
        it('updates APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $apbs = Apbs::factory()->active()->create();

            $response = $this->actingAs($admin)
                ->putJson("/api/v1/apbs/{$apbs->id}", [
                    'keterangan' => 'Updated description',
                ]);

            $response->assertOk()
                ->assertJsonPath('data.keterangan', 'Updated description');
        });

        it('cannot update closed APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $apbs = Apbs::factory()->closed()->create();

            $response = $this->actingAs($admin)
                ->putJson("/api/v1/apbs/{$apbs->id}", [
                    'keterangan' => 'Updated description',
                ]);

            $response->assertForbidden();
        });
    });

    describe('DELETE /api/v1/apbs/{id}', function () {
        it('deletes pending APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $apbs = Apbs::factory()->pending()->create();

            $response = $this->actingAs($admin)
                ->deleteJson("/api/v1/apbs/{$apbs->id}");

            $response->assertNoContent();

            expect(Apbs::find($apbs->id))->toBeNull();
        });

        it('cannot delete active APBS', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-budget');

            $apbs = Apbs::factory()->active()->create();

            $response = $this->actingAs($admin)
                ->deleteJson("/api/v1/apbs/{$apbs->id}");

            $response->assertForbidden();
        });
    });
});

describe('APBS Budget Tracking', function () {
    it('shows realization percentage', function () {
        $admin = User::factory()->admin()->create();
        $admin->givePermissionTo('view-budget');

        $apbs = Apbs::factory()->create([
            'total_anggaran' => 100000000,
            'total_realisasi' => 75000000,
            'sisa_anggaran' => 25000000,
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/apbs/{$apbs->id}");

        $response->assertOk();

        $data = $response->json('data');
        expect((float) $data['total_anggaran'])->toBe(100000000.0)
            ->and((float) $data['total_realisasi'])->toBe(75000000.0)
            ->and((float) $data['sisa_anggaran'])->toBe(25000000.0);
    });

    it('filters by realization status', function () {
        $admin = User::factory()->admin()->create();
        $admin->givePermissionTo('view-budget');

        // High realization (>80%)
        Apbs::factory()->create([
            'total_anggaran' => 100000000,
            'total_realisasi' => 90000000,
            'sisa_anggaran' => 10000000,
        ]);

        // Low realization (<50%)
        Apbs::factory()->create([
            'total_anggaran' => 100000000,
            'total_realisasi' => 30000000,
            'sisa_anggaran' => 70000000,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/apbs');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(2);
    });
});
