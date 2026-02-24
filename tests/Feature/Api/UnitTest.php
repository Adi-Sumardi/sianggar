<?php

declare(strict_types=1);

use App\Models\Unit;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // Create necessary permissions
    Permission::create(['name' => 'manage-units', 'guard_name' => 'web']);

    $this->admin = User::factory()->admin()->create();
    $this->admin->givePermissionTo('manage-units');
});

describe('GET /api/v1/units', function () {
    it('returns paginated units for admin', function () {
        Unit::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/units');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'nama', 'kode'],
                ],
                'meta',
            ]);
    });

    it('supports search by name or code', function () {
        Unit::factory()->create(['nama' => 'Sekolah Dasar', 'kode' => 'SD']);
        Unit::factory()->create(['nama' => 'Sekolah Menengah', 'kode' => 'SMP']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/units?search=Dasar');

        $response->assertOk();
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.nama'))->toBe('Sekolah Dasar');
    });
});

describe('GET /api/v1/units/list', function () {
    it('returns all units as simple list', function () {
        Unit::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/units/list');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'nama', 'kode'],
                ],
            ]);
    });
});

describe('POST /api/v1/units', function () {
    it('creates a new unit', function () {
        $data = [
            'nama' => 'Sekolah Dasar Test',
            'kode' => 'SDT',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/units', $data);

        $response->assertCreated()
            ->assertJsonPath('data.nama', 'Sekolah Dasar Test')
            ->assertJsonPath('data.kode', 'SDT');

        $this->assertDatabaseHas('units', $data);
    });

    it('validates required fields', function () {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/units', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['nama', 'kode']);
    });

    it('validates unique kode', function () {
        Unit::factory()->create(['kode' => 'SD']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/units', [
                'nama' => 'Another School',
                'kode' => 'SD',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['kode']);
    });

    it('requires admin permission', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/units', [
                'nama' => 'Test',
                'kode' => 'TST',
            ]);

        $response->assertForbidden();
    });
});

describe('GET /api/v1/units/{id}', function () {
    it('returns unit details', function () {
        $unit = Unit::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/units/{$unit->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $unit->id)
            ->assertJsonPath('data.nama', $unit->nama);
    });

    it('returns 404 for non-existent unit', function () {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/units/99999');

        $response->assertNotFound();
    });
});

describe('PUT /api/v1/units/{id}', function () {
    it('updates unit', function () {
        $unit = Unit::factory()->create();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/units/{$unit->id}", [
                'nama' => 'Updated Name',
                'kode' => $unit->kode,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.nama', 'Updated Name');

        $this->assertDatabaseHas('units', ['id' => $unit->id, 'nama' => 'Updated Name']);
    });
});

describe('DELETE /api/v1/units/{id}', function () {
    it('deletes unit', function () {
        $unit = Unit::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/units/{$unit->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('units', ['id' => $unit->id]);
    });
});
