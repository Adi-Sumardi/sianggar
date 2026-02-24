<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;

uses(RefreshDatabase::class);

describe('Notification API', function () {
    describe('GET /api/v1/notifications', function () {
        it('returns user notifications', function () {
            $user = User::factory()->create();

            // Create some notifications for the user
            $user->notify(new class extends \Illuminate\Notifications\Notification
            {
                public function via($notifiable): array
                {
                    return ['database'];
                }

                public function toDatabase($notifiable): array
                {
                    return [
                        'title' => 'Test Notification',
                        'message' => 'This is a test',
                    ];
                }
            });

            $response = $this->actingAs($user)
                ->getJson('/api/v1/notifications');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'type',
                            'title',
                            'message',
                            'read_at',
                            'created_at',
                        ],
                    ],
                    'unread_count',
                ]);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/notifications');

            $response->assertUnauthorized();
        });
    });

    describe('GET /api/v1/notifications/unread-count', function () {
        it('returns unread notification count', function () {
            $user = User::factory()->create();

            // Create unread notifications
            for ($i = 0; $i < 3; $i++) {
                $user->notify(new class extends \Illuminate\Notifications\Notification
                {
                    public function via($notifiable): array
                    {
                        return ['database'];
                    }

                    public function toDatabase($notifiable): array
                    {
                        return ['message' => 'Test'];
                    }
                });
            }

            $response = $this->actingAs($user)
                ->getJson('/api/v1/notifications/unread-count');

            $response->assertOk()
                ->assertJson([
                    'data' => [
                        'count' => 3,
                    ],
                ]);
        });
    });

    describe('POST /api/v1/notifications/{id}/read', function () {
        it('marks notification as read', function () {
            $user = User::factory()->create();

            $user->notify(new class extends \Illuminate\Notifications\Notification
            {
                public function via($notifiable): array
                {
                    return ['database'];
                }

                public function toDatabase($notifiable): array
                {
                    return ['message' => 'Test'];
                }
            });

            $notification = $user->notifications()->first();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/notifications/{$notification->id}/read");

            $response->assertOk();

            $notification->refresh();
            expect($notification->read_at)->not->toBeNull();
        });
    });

    describe('POST /api/v1/notifications/read-all', function () {
        it('marks all notifications as read', function () {
            $user = User::factory()->create();

            // Create multiple notifications
            for ($i = 0; $i < 5; $i++) {
                $user->notify(new class extends \Illuminate\Notifications\Notification
                {
                    public function via($notifiable): array
                    {
                        return ['database'];
                    }

                    public function toDatabase($notifiable): array
                    {
                        return ['message' => 'Test'];
                    }
                });
            }

            $response = $this->actingAs($user)
                ->postJson('/api/v1/notifications/read-all');

            $response->assertOk();

            expect($user->unreadNotifications()->count())->toBe(0);
        });
    });

    describe('DELETE /api/v1/notifications/{id}', function () {
        it('deletes a notification', function () {
            $user = User::factory()->create();

            $user->notify(new class extends \Illuminate\Notifications\Notification
            {
                public function via($notifiable): array
                {
                    return ['database'];
                }

                public function toDatabase($notifiable): array
                {
                    return ['message' => 'Test'];
                }
            });

            $notification = $user->notifications()->first();

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/notifications/{$notification->id}");

            $response->assertNoContent();

            expect($user->notifications()->count())->toBe(0);
        });
    });
});
