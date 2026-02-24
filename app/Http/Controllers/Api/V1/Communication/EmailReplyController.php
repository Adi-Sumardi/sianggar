<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Communication;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communication\StoreEmailReplyRequest;
use App\Http\Resources\EmailReplyResource;
use App\Models\Attachment;
use App\Models\Email;
use App\Models\EmailReply;
use App\Models\User;
use App\Notifications\NewEmailReplyNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class EmailReplyController extends Controller
{
    /**
     * Store a new reply to an email.
     */
    public function store(StoreEmailReplyRequest $request, Email $email): JsonResponse
    {
        // Only users who can view the email can reply
        $this->authorize('view', $email);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $data = $request->safe()->only(['isi', 'status_reply']);
        $data['email_id'] = $email->id;
        $data['user_id'] = $user->id;

        $reply = EmailReply::create($data);

        // Handle file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('email-replies/' . $reply->id, 'public');
                $url = Storage::disk('public')->url($path);

                Attachment::create([
                    'attachable_type' => EmailReply::class,
                    'attachable_id' => $reply->id,
                    'uploaded_by' => $user->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $url,
                    'file_mime' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        $reply->load(['user', 'attachments']);

        // Update email status to indicate it has been replied to
        $email->update([
            'status' => 'in-process',
        ]);

        // Send notifications to email sender and other recipients
        $this->notifyAboutReply($reply, $email, $user);

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'data' => new EmailReplyResource($reply),
        ], 201);
    }

    /**
     * Send notifications about the reply to relevant users.
     */
    protected function notifyAboutReply(EmailReply $reply, Email $email, User $replier): void
    {
        $notifiedUserIds = [$replier->id]; // Don't notify the replier

        // Notify the original email sender
        if ($email->user_id && ! in_array($email->user_id, $notifiedUserIds)) {
            $email->user?->notify(new NewEmailReplyNotification($reply, $email));
            $notifiedUserIds[] = $email->user_id;
        }

        // Notify all recipients
        $email->load('recipients');
        foreach ($email->recipients as $recipient) {
            // If recipient is a specific user
            if ($recipient->user_id && ! in_array($recipient->user_id, $notifiedUserIds)) {
                $recipient->user?->notify(new NewEmailReplyNotification($reply, $email));
                $notifiedUserIds[] = $recipient->user_id;
            }

            // If recipient is a role, notify all users with that role
            if ($recipient->role) {
                $roleEnum = UserRole::tryFrom($recipient->role);
                if ($roleEnum) {
                    $usersWithRole = User::where('role', $roleEnum)
                        ->whereNotIn('id', $notifiedUserIds)
                        ->get();

                    foreach ($usersWithRole as $user) {
                        $user->notify(new NewEmailReplyNotification($reply, $email));
                        $notifiedUserIds[] = $user->id;
                    }
                }
            }
        }
    }
}
