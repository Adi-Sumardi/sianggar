<?php

declare(strict_types=1);

use App\Enums\EmailStatus;
use App\Models\Email;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-emails', 'guard_name' => 'web']);
    Permission::create(['name' => 'manage-emails', 'guard_name' => 'web']);
});

describe('Email API', function () {
    describe('GET /api/v1/emails', function () {
        it('returns paginated list of emails', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            Email::factory()->count(5)->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/emails');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'name_surat',
                            'no_surat',
                            'status',
                            'ditujukan',
                            'tgl_surat',
                        ],
                    ],
                ]);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/emails');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/emails');

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/emails/{id}', function () {
        it('returns email details', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            $email = Email::factory()->create();

            $response = $this->actingAs($user)
                ->getJson("/api/v1/emails/{$email->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'name_surat',
                        'no_surat',
                        'isi_surat',
                        'status',
                        'ditujukan',
                        'tgl_surat',
                        'user',
                    ],
                ]);
        });

        it('returns 404 for non-existent email', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            $response = $this->actingAs($user)
                ->getJson('/api/v1/emails/999999');

            $response->assertNotFound();
        });
    });

    describe('POST /api/v1/emails', function () {
        it('creates a new email', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-emails');

            $data = [
                'name_surat' => 'Surat Undangan Rapat',
                'no_surat' => 'SI-001/2025',
                'isi_surat' => 'Dengan hormat, mengundang Bapak/Ibu...',
                'tgl_surat' => '2025-06-15',
                'ditujukan' => 'Kepala Sekolah SD',
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/emails', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'name_surat',
                        'no_surat',
                        'status',
                    ],
                ])
                ->assertJsonPath('data.name_surat', 'Surat Undangan Rapat')
                ->assertJsonPath('data.status', EmailStatus::Draft->value);
        });

        it('validates required fields', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-emails');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/emails', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['name_surat', 'isi_surat']);
        });

        it('returns 403 without manage-emails permission', function () {
            $user = User::factory()->create();
            $user->givePermissionTo('view-emails');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/emails', [
                    'name_surat' => 'Test',
                    'isi_surat' => 'Test content',
                ]);

            $response->assertForbidden();
        });
    });

    describe('DELETE /api/v1/emails/{id}', function () {
        it('deletes an email', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('manage-emails');

            $email = Email::factory()->draft()->create();

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/emails/{$email->id}");

            $response->assertNoContent();

            expect(Email::find($email->id))->toBeNull();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $email = Email::factory()->create();

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/emails/{$email->id}");

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/emails/{id}/archive', function () {
        it('archives an email', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/emails/{$email->id}/archive");

            $response->assertOk();

            $email->refresh();
            expect($email->status)->toBe(EmailStatus::Archived);
        });
    });
});
