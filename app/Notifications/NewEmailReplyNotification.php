<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Email;
use App\Models\EmailReply;
use Illuminate\Notifications\Notification;

class NewEmailReplyNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly EmailReply $reply,
        public readonly Email $email,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', \App\Channels\SaungWaChannel::class];
    }

    public function toSaungWa(object $notifiable): string
    {
        $replierName = $this->reply->user?->name ?? 'Unknown';
        return "↩️ *SIANGGAR*\n{$replierName} membalas surat: {$this->email->name_surat}";
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_email_reply',
            'email_id' => $this->email->id,
            'reply_id' => $this->reply->id,
            'no_surat' => $this->email->no_surat,
            'name_surat' => $this->email->name_surat,
            'replier_id' => $this->reply->user_id,
            'replier_name' => $this->reply->user?->name ?? 'Unknown',
            'message' => "{$this->reply->user?->name} membalas surat: {$this->email->name_surat}",
            'icon' => 'reply',
            'color' => 'green',
        ];
    }
}
