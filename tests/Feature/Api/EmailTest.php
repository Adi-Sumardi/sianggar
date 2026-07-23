<?php

declare(strict_types=1);

use App\Enums\EmailStatus;
use App\Enums\UserRole;
use App\Models\Email;
use App\Models\EmailRecipient;
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

        it('returns email details by ulid (route binding utama)', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            $email = Email::factory()->create();

            expect($email->ulid)->not->toBeNull();

            $response = $this->actingAs($user)
                ->getJson("/api/v1/emails/{$email->ulid}");

            $response->assertOk()
                ->assertJsonPath('data.id', $email->id)
                ->assertJsonPath('data.ulid', $email->ulid);
        });

        it('returns 404 for non-existent email', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-emails');

            $response = $this->actingAs($user)
                ->getJson('/api/v1/emails/999999');

            $response->assertNotFound();
        });

        it('marks the email as read for a recipient viewing it via ditujukan (legacy role match)', function () {
            $sender = User::factory()->create();
            $recipient = User::factory()->withRole(UserRole::StaffDirektur)->create();
            $recipient->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create([
                'user_id' => $sender->id,
                'ditujukan' => UserRole::StaffDirektur->value,
            ]);

            $this->actingAs($recipient)
                ->getJson("/api/v1/emails/{$email->id}")
                ->assertOk();

            $recipientRow = EmailRecipient::query()
                ->where('email_id', $email->id)
                ->where('user_id', $recipient->id)
                ->first();

            expect($recipientRow)->not->toBeNull();
            expect($recipientRow->is_read)->toBeTrue();
            expect($recipientRow->read_at)->not->toBeNull();
        });

        it('marks the email as read for an explicit EmailRecipient row', function () {
            $sender = User::factory()->create();
            $recipient = User::factory()->create();
            $recipient->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create(['user_id' => $sender->id]);
            $emailRecipient = EmailRecipient::create([
                'email_id' => $email->id,
                'user_id' => $recipient->id,
            ]);

            $this->actingAs($recipient)
                ->getJson("/api/v1/emails/{$email->id}")
                ->assertOk();

            $emailRecipient->refresh();
            expect($emailRecipient->is_read)->toBeTrue();
            expect($emailRecipient->read_at)->not->toBeNull();
        });

        it('does not mark the email as read when the sender views their own email', function () {
            $sender = User::factory()->create();
            $sender->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create(['user_id' => $sender->id]);

            $this->actingAs($sender)
                ->getJson("/api/v1/emails/{$email->id}")
                ->assertOk();

            expect(EmailRecipient::where('email_id', $email->id)->count())->toBe(0);
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

        it('allows the recipient (not just the sender) to archive an email', function () {
            // Regresi: EmailController::archive() dulu authorize('update', ...)
            // yang cuma izinkan pengirim asli - penerima yang sudah boleh
            // membalas surat (view policy) malah 403 saat mengarsipkan.
            $sender = User::factory()->create();
            $recipient = User::factory()->withRole(UserRole::StaffDirektur)->create();
            $recipient->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create([
                'user_id' => $sender->id,
                'ditujukan' => UserRole::StaffDirektur->value,
            ]);

            $response = $this->actingAs($recipient)
                ->postJson("/api/v1/emails/{$email->id}/archive");

            $response->assertOk();

            $email->refresh();
            expect($email->status)->toBe(EmailStatus::Archived);
        });

        it('forbids a user unrelated to the email from archiving it', function () {
            $sender = User::factory()->create();
            $stranger = User::factory()->withRole(UserRole::Umum)->create();
            $stranger->givePermissionTo('view-emails');

            $email = Email::factory()->sent()->create([
                'user_id' => $sender->id,
                'ditujukan' => UserRole::StaffDirektur->value,
            ]);

            $response = $this->actingAs($stranger)
                ->postJson("/api/v1/emails/{$email->id}/archive");

            $response->assertForbidden();
        });
    });
});
