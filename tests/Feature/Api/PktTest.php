<?php

declare(strict_types=1);

use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\MataAnggaran;
use App\Models\Pkt;
use App\Models\Proker;
use App\Models\Strategy;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'manage-planning', 'guard_name' => 'web']);
});

/**
 * Helper function to create the planning hierarchy.
 */
function createPlanningHierarchyForApi(): array
{
    $strategy = Strategy::factory()->create();
    $indikator = Indikator::factory()->create(['strategy_id' => $strategy->id]);
    $proker = Proker::factory()->create([
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
    ]);
    $kegiatan = Kegiatan::factory()->create([
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
        'proker_id' => $proker->id,
    ]);

    return [
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
        'proker_id' => $proker->id,
        'kegiatan_id' => $kegiatan->id,
    ];
}

describe('PKT API', function () {
    describe('GET /api/v1/pkt', function () {
        it('returns paginated list of PKT for admin', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-planning');

            Pkt::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pkt');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'deskripsi_kegiatan',
                            'saldo_anggaran',
                            'status',
                            'tahun',
                        ],
                    ],
                ]);
        });

        it('returns PKT filtered by unit for unit user', function () {
            $unit = Unit::factory()->create();
            $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $unitUser->givePermissionTo('manage-planning');

            // Create PKT for this unit
            Pkt::factory()->count(3)->create(['unit_id' => $unit->id]);

            // Create PKT for other units
            Pkt::factory()->count(2)->create();

            $response = $this->actingAs($unitUser)
                ->getJson('/api/v1/pkt');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(3);
        });

        it('filters by status', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-planning');

            Pkt::factory()->draft()->count(3)->create();
            Pkt::factory()->submitted()->count(2)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pkt?status=draft');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(3);
        });

        it('filters by year', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-planning');

            Pkt::factory()->forYear('2024')->count(2)->create();
            Pkt::factory()->forYear('2025')->count(4)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pkt?tahun=2025');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(4);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/pkt');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/pkt');

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pkt', function () {
        it('creates a new PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchyForApi();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Kegiatan Pembelajaran',
                'tujuan_kegiatan' => 'Meningkatkan kualitas',
                'saldo_anggaran' => 10000000,
                'volume' => 1,
                'satuan' => 'paket',
                ...$hierarchy,
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pkt', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'deskripsi_kegiatan',
                        'saldo_anggaran',
                        'status',
                    ],
                ])
                ->assertJsonPath('data.deskripsi_kegiatan', 'Kegiatan Pembelajaran')
                ->assertJsonPath('data.status', 'draft');
        });

        it('validates required fields', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pkt', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['strategy_id', 'mata_anggaran_id', 'tahun', 'saldo_anggaran']);
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pkt', [
                    'deskripsi_kegiatan' => 'Test',
                    'saldo_anggaran' => 1000000,
                ]);

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/pkt/{id}', function () {
        it('returns PKT details', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->create();

            $response = $this->actingAs($user)
                ->getJson("/api/v1/pkt/{$pkt->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'deskripsi_kegiatan',
                        'tujuan_kegiatan',
                        'saldo_anggaran',
                        'status',
                        'tahun',
                    ],
                ])
                ->assertJsonPath('data.id', $pkt->id);
        });

        it('returns 404 for non-existent PKT', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-planning');

            $response = $this->actingAs($user)
                ->getJson('/api/v1/pkt/999999');

            $response->assertNotFound();
        });
    });

    describe('PUT /api/v1/pkt/{id}', function () {
        it('updates a draft PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->draft()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/pkt/{$pkt->id}", [
                    'deskripsi_kegiatan' => 'Updated Kegiatan',
                    'saldo_anggaran' => 15000000,
                ]);

            $response->assertOk()
                ->assertJsonPath('data.deskripsi_kegiatan', 'Updated Kegiatan');
        });

        it('cannot update submitted PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->submitted()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/pkt/{$pkt->id}", [
                    'deskripsi_kegiatan' => 'Updated Kegiatan',
                ]);

            $response->assertForbidden();
        });
    });

    describe('DELETE /api/v1/pkt/{id}', function () {
        it('deletes a draft PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->draft()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/pkt/{$pkt->id}");

            $response->assertNoContent();

            expect(Pkt::find($pkt->id))->toBeNull();
        });

        it('cannot delete submitted PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->submitted()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/pkt/{$pkt->id}");

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pkt/{id}/submit', function () {
        it('submits a draft PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->draft()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/pkt/{$pkt->id}/submit");

            $response->assertOk()
                ->assertJsonPath('data.status', 'submitted');
        });

        it('cannot submit already submitted PKT', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('manage-planning');

            $pkt = Pkt::factory()->submitted()->create([
                'unit_id' => $user->unit_id,
                'created_by' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/pkt/{$pkt->id}/submit");

            $response->assertUnprocessable();
        });
    });
});
