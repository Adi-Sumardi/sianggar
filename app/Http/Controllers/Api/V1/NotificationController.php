<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->data['type'] ?? 'general',
                    'title' => $this->getNotificationTitle($notification->data),
                    'message' => $notification->data['message'] ?? '',
                    'icon' => $notification->data['icon'] ?? 'bell',
                    'color' => $notification->data['color'] ?? 'primary',
                    'link' => $this->getNotificationLink($notification->data),
                    'read_at' => $notification->read_at?->toISOString(),
                    'created_at' => $notification->created_at->toISOString(),
                ];
            });

        return response()->json([
            'data' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return response()->json([
            'data' => [
                'count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $notification = $user->notifications()->where('id', $id)->first();

        if (! $notification) {
            return response()->json([
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $user->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $notification = $user->notifications()->where('id', $id)->first();

        if (! $notification) {
            return response()->json([
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $notification->delete();

        return response()->json(null, 204);
    }

    /**
     * Get notification title based on type.
     */
    private function getNotificationTitle(array $data): string
    {
        return match ($data['type'] ?? 'general') {
            'new_proposal' => 'Pengajuan Baru',
            'proposal_approved' => 'Pengajuan Disetujui',
            'proposal_fully_approved' => 'Pengajuan Selesai',
            'proposal_revised' => 'Pengajuan Perlu Revisi',
            'proposal_rejected' => 'Pengajuan Ditolak',
            'new_lpj' => 'LPJ Baru',
            'lpj_approved' => 'LPJ Disetujui',
            'lpj_revised' => 'LPJ Perlu Revisi',
            'lpj_rejected' => 'LPJ Ditolak',
            'new_email' => 'Surat Masuk',
            'new_email_reply' => 'Balasan Surat',
            default => 'Notifikasi',
        };
    }

    /**
     * Get notification link based on type.
     */
    private function getNotificationLink(array $data): ?string
    {
        $type = $data['type'] ?? '';

        if (str_contains($type, 'proposal')) {
            $id = $data['pengajuan_id'] ?? null;
            return $id ? "/pengajuan/{$id}" : null;
        }

        if (str_contains($type, 'lpj')) {
            $id = $data['lpj_id'] ?? null;
            return $id ? "/lpj/{$id}" : null;
        }

        if (str_contains($type, 'email')) {
            $id = $data['email_id'] ?? null;
            return $id ? "/emails/{$id}" : null;
        }

        return null;
    }
}
