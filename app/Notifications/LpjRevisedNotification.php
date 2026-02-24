<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Lpj;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LpjRevisedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly Lpj $lpj,
        public readonly User $approver,
        public readonly string $catatan = '',
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = "LPJ \"{$this->lpj->perihal}\" perlu direvisi oleh {$this->approver->name}.";

        if ($this->catatan !== '') {
            $message .= " Catatan: {$this->catatan}";
        }

        return [
            'type' => 'lpj_revised',
            'lpj_id' => $this->lpj->id,
            'perihal' => $this->lpj->perihal,
            'unit' => $this->lpj->unit,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'catatan' => $this->catatan,
            'message' => $message,
            'icon' => 'edit',
            'color' => 'warning',
        ];
    }
}
