<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Communication;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communication\StoreEmailRequest;
use App\Http\Resources\EmailResource;
use App\Models\Attachment;
use App\Models\Email;
use App\Models\EmailRecipient;
use App\Models\User;
use App\Notifications\NewEmailNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class EmailController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Email::class, 'email');
    }

    /**
     * Display a paginated listing of emails with filter support (inbox, sent, archive).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Email::with(['user', 'recipients.user']);

        $filter = $request->query('filter', 'inbox');

        switch ($filter) {
            case 'sent':
                $query->where('user_id', $user->id)
                      ->whereNull('status_arsip');
                break;
            case 'archive':
                $query->where('status_arsip', 'archived');
                break;
            case 'inbox':
            default:
                // Filter by legacy ditujukan field OR by recipients table
                $query->where(function ($q) use ($user) {
                    // Legacy: check ditujukan field
                    $q->where('ditujukan', $user->role->value)
                      ->orWhere('ditujukan', $user->name)
                      // New: check recipients table
                      ->orWhereHas('recipients', function ($rq) use ($user) {
                          $rq->where('user_id', $user->id)
                             ->orWhere('role', $user->role->value);
                      });
                })->whereNull('status_arsip');
                break;
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name_surat', 'like', "%{$search}%")
                  ->orWhere('no_surat', 'like', "%{$search}%")
                  ->orWhere('isi_surat', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderByDesc('created_at')->paginate($perPage);

        return EmailResource::collection($items);
    }

    /**
     * Store a newly created email.
     */
    public function store(StoreEmailRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return DB::transaction(function () use ($request, $user) {
            $data = $request->validated();
            $recipients = $data['recipients'] ?? [];
            unset($data['recipients'], $data['files']);

            $data['user_id'] = $user->id;
            $data['status'] = $data['status'] ?? 'draft';

            // Auto-generate nomor surat if not provided
            if (empty($data['no_surat'])) {
                $data['no_surat'] = $this->generateNoSurat();
            }

            $email = Email::create($data);

            // Create recipients
            foreach ($recipients as $recipient) {
                EmailRecipient::create([
                    'email_id' => $email->id,
                    'user_id' => $recipient['user_id'] ?? null,
                    'role' => $recipient['role'] ?? null,
                ]);
            }

            // Handle file uploads
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('emails/' . $email->id, 'public');

                    Attachment::create([
                        'attachable_type' => Email::class,
                        'attachable_id' => $email->id,
                        'uploaded_by' => $user->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => '/storage/' . $path,
                        'file_mime' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            $email->load(['user', 'recipients.user', 'attachments']);

            // Send notifications to recipients
            $this->notifyRecipients($email);

            return response()->json([
                'message' => 'Surat berhasil dikirim.',
                'data' => new EmailResource($email),
            ], 201);
        });
    }

    /**
     * Generate nomor surat.
     */
    protected function generateNoSurat(): string
    {
        $year = date('Y');
        $count = Email::whereYear('created_at', $year)->count() + 1;

        return sprintf('SI/%s/%03d', $year, $count);
    }

    /**
     * Display the specified email.
     */
    public function show(Email $email): JsonResponse
    {
        $email->load(['user', 'replies.user', 'replies.attachments', 'attachments', 'recipients.user']);

        return response()->json([
            'data' => new EmailResource($email),
        ]);
    }

    /**
     * Remove the specified email.
     */
    public function destroy(Email $email): JsonResponse
    {
        $email->delete();

        return response()->json(null, 204);
    }

    /**
     * Archive the specified email.
     */
    public function archive(Request $request, Email $email): JsonResponse
    {
        $this->authorize('update', $email);

        $email->update([
            'status' => 'archived',
            'status_arsip' => 'archived',
        ]);

        return response()->json([
            'message' => 'Surat berhasil diarsipkan.',
            'data' => new EmailResource($email),
        ]);
    }

    /**
     * Send notifications to all recipients of an email.
     */
    protected function notifyRecipients(Email $email): void
    {
        $notifiedUserIds = [];

        foreach ($email->recipients as $recipient) {
            // If recipient is a specific user
            if ($recipient->user_id && ! in_array($recipient->user_id, $notifiedUserIds)) {
                $recipient->user?->notify(new NewEmailNotification($email));
                $notifiedUserIds[] = $recipient->user_id;
            }

            // If recipient is a role, notify all users with that role
            if ($recipient->role) {
                $roleEnum = UserRole::tryFrom($recipient->role);
                if ($roleEnum) {
                    $usersWithRole = User::where('role', $roleEnum)
                        ->where('id', '!=', $email->user_id) // Don't notify sender
                        ->whereNotIn('id', $notifiedUserIds)
                        ->get();

                    foreach ($usersWithRole as $user) {
                        $user->notify(new NewEmailNotification($email));
                        $notifiedUserIds[] = $user->id;
                    }
                }
            }
        }
    }

    /**
     * Get available recipients (users and roles) for the email form.
     */
    public function recipients(Request $request): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();

        // Get all users except current user
        $users = User::where('id', '!=', $currentUser->id)
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'type' => 'user',
                'user_id' => $user->id,
                'role' => null,
                'label' => $user->name,
                'description' => $user->role->label(),
            ]);

        return response()->json([
            'data' => [
                'users' => $users,
                'roles' => [],
            ],
        ]);
    }

    /**
     * Get email reminder stats for login notification.
     */
    public function reminderStats(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Count unread emails for this user
        $unreadEmailCount = $user->unreadNotifications()
            ->whereJsonContains('data->type', 'new_email')
            ->count();

        // Count unread email replies for this user
        $unreadReplyCount = $user->unreadNotifications()
            ->whereJsonContains('data->type', 'new_email_reply')
            ->count();

        return response()->json([
            'data' => [
                'unread_email_count' => $unreadEmailCount,
                'unread_reply_count' => $unreadReplyCount,
            ],
        ]);
    }
}
