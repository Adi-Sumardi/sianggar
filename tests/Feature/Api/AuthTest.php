<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Auth API', function () {
    describe('POST /api/v1/auth/login', function () {
        it('logs in a user with valid credentials', function () {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => bcrypt('password123'),
            ]);

            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'user' => ['id', 'name', 'email', 'role'],
                    ],
                ]);
        });

        it('returns error for invalid credentials', function () {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => bcrypt('password123'),
            ]);

            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'wrongpassword',
            ]);

            $response->assertUnauthorized();
        });

        it('returns error for non-existent user', function () {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'nonexistent@example.com',
                'password' => 'password123',
            ]);

            $response->assertUnauthorized();
        });

        it('requires email and password', function () {
            $response = $this->postJson('/api/v1/auth/login', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['email', 'password']);
        });

        it('requires valid email format', function () {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'invalid-email',
                'password' => 'password123',
            ]);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['email']);
        });
    });

    describe('GET /api/v1/auth/me', function () {
        it('returns authenticated user data', function () {
            $user = User::factory()->create([
                'role' => UserRole::Admin->value,
            ]);

            $response = $this->actingAs($user)
                ->getJson('/api/v1/auth/me');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'name',
                        'email',
                        'role',
                    ],
                ])
                ->assertJsonPath('data.id', $user->id)
                ->assertJsonPath('data.email', $user->email)
                ->assertJsonPath('data.role', UserRole::Admin->value);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/auth/me');

            $response->assertUnauthorized();
        });

        it('includes unit data for unit users', function () {
            $user = User::factory()->unit('sd')->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/auth/me');

            $response->assertOk()
                ->assertJsonPath('data.role', UserRole::SD->value);
        });
    });

    describe('POST /api/v1/auth/logout', function () {
        it('logs out authenticated user', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->postJson('/api/v1/auth/logout');

            $response->assertOk()
                ->assertJson(['message' => 'Logout berhasil.']);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->postJson('/api/v1/auth/logout');

            $response->assertUnauthorized();
        });
    });
});
