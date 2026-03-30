<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Email;
use Illuminate\Notifications\Notification;

class NewEmailNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
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
        $senderName = $this->email->user?->name ?? 'Unknown';
        return "✉️ *SIANGGAR*\nSurat baru dari {$senderName}: {$this->email->name_surat}";
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_email',
            'email_id' => $this->email->id,
            'no_surat' => $this->email->no_surat,
            'name_surat' => $this->email->name_surat,
            'sender_id' => $this->email->user_id,
            'sender_name' => $this->email->user?->name ?? 'Unknown',
            'message' => "Surat baru dari {$this->email->user?->name}: {$this->email->name_surat}",
            'icon' => 'mail',
            'color' => 'blue',
        ];
    }
}
