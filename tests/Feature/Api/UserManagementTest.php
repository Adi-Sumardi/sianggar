<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
    Permission::create(['name' => 'manage-units', 'guard_name' => 'web']);
});

describe('User Management API', function () {
    describe('GET /api/v1/users', function () {
        it('returns paginated list of users', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            User::factory()->count(10)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/users');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'email',
                            'role',
                        ],
                    ],
                    'meta' => ['current_page', 'total'],
                ]);
        });

        it('filters by role', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            User::factory()->direktur()->count(3)->create();
            User::factory()->keuangan()->count(2)->create();
            User::factory()->unit('sd')->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/users?role=direktur');

            $response->assertOk();
            expect($response->json('meta.total'))->toBe(3);
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/users');

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/users', function () {
        it('creates a new user', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/users', [
                    'name' => 'New User',
                    'email' => 'newuser@example.com',
                    'password' => 'password123',
                    'password_confirmation' => 'password123',
                    'role' => UserRole::StaffKeuangan->value,
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.name', 'New User')
                ->assertJsonPath('data.email', 'newuser@example.com')
                ->assertJsonPath('data.role', UserRole::StaffKeuangan->value);
        });

        it('validates required fields', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/users', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
        });

        it('validates unique email', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            User::factory()->create(['email' => 'existing@example.com']);

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/users', [
                    'name' => 'New User',
                    'email' => 'existing@example.com',
                    'password' => 'password123',
                    'password_confirmation' => 'password123',
                    'role' => UserRole::StaffKeuangan->value,
                ]);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['email']);
        });
    });

    describe('GET /api/v1/users/{id}', function () {
        it('returns user details', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $user = User::factory()->direktur()->create();

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/users/{$user->id}");

            $response->assertOk()
                ->assertJsonPath('data.id', $user->id)
                ->assertJsonPath('data.email', $user->email);
        });

        it('returns 404 for non-existent user', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/users/999999');

            $response->assertNotFound();
        });
    });

    describe('PUT /api/v1/users/{id}', function () {
        it('updates user data', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $user = User::factory()->create();

            $response = $this->actingAs($admin)
                ->putJson("/api/v1/users/{$user->id}", [
                    'name' => 'Updated Name',
                    'email' => $user->email,
                    'role' => UserRole::Direktur->value,
                ]);

            $response->assertOk()
                ->assertJsonPath('data.name', 'Updated Name')
                ->assertJsonPath('data.role', UserRole::Direktur->value);
        });
    });

    describe('PATCH /api/v1/users/{id}/password', function () {
        it('updates user password', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $user = User::factory()->create();

            $response = $this->actingAs($admin)
                ->patchJson("/api/v1/users/{$user->id}/password", [
                    'password' => 'newpassword123',
                    'password_confirmation' => 'newpassword123',
                ]);

            $response->assertOk();
        });

        it('validates password confirmation', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $user = User::factory()->create();

            $response = $this->actingAs($admin)
                ->patchJson("/api/v1/users/{$user->id}/password", [
                    'password' => 'newpassword123',
                    'password_confirmation' => 'differentpassword',
                ]);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['password']);
        });
    });

    describe('DELETE /api/v1/users/{id}', function () {
        it('deletes a user', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $user = User::factory()->create();

            $response = $this->actingAs($admin)
                ->deleteJson("/api/v1/users/{$user->id}");

            $response->assertOk();
            expect(User::find($user->id))->toBeNull();
        });

        it('returns 404 for non-existent user', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-users');

            $response = $this->actingAs($admin)
                ->deleteJson('/api/v1/users/999999');

            $response->assertNotFound();
        });
    });
});

describe('Unit Management API', function () {
    describe('GET /api/v1/units', function () {
        it('returns list of units', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-units');

            Unit::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/units');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nama',
                            'kode',
                        ],
                    ],
                ]);
        });
    });

    describe('GET /api/v1/units/list', function () {
        it('returns unit list for dropdowns (accessible to all)', function () {
            $user = User::factory()->unit('sd')->create();

            Unit::factory()->count(5)->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/units/list');

            $response->assertOk();
        });
    });

    describe('POST /api/v1/units', function () {
        it('creates a new unit', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-units');

            $response = $this->actingAs($admin)
                ->postJson('/api/v1/units', [
                    'nama' => 'New Unit',
                    'kode' => 'new-unit',
                ]);

            $response->assertCreated()
                ->assertJsonPath('data.nama', 'New Unit')
                ->assertJsonPath('data.kode', 'new-unit');
        });
    });

    describe('PUT /api/v1/units/{id}', function () {
        it('updates a unit', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-units');

            $unit = Unit::factory()->create();

            $response = $this->actingAs($admin)
                ->putJson("/api/v1/units/{$unit->id}", [
                    'nama' => 'Updated Unit',
                    'kode' => 'updated-unit',
                ]);

            $response->assertOk()
                ->assertJsonPath('data.nama', 'Updated Unit');
        });
    });

    describe('DELETE /api/v1/units/{id}', function () {
        it('deletes a unit', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('manage-units');

            $unit = Unit::factory()->create();

            $response = $this->actingAs($admin)
                ->deleteJson("/api/v1/units/{$unit->id}");

            $response->assertOk();
            expect(Unit::find($unit->id))->toBeNull();
        });
    });
});
