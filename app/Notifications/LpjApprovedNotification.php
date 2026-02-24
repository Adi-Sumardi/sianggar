<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Lpj;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LpjApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly Lpj $lpj,
        public readonly User $approver,
        public readonly bool $isFinal = false,
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
        $message = $this->isFinal
            ? "LPJ \"{$this->lpj->perihal}\" telah disetujui sepenuhnya oleh {$this->approver->name}"
            : "LPJ \"{$this->lpj->perihal}\" telah disetujui oleh {$this->approver->name} dan dilanjutkan ke tahap berikutnya";

        return [
            'type' => 'lpj_approved',
            'lpj_id' => $this->lpj->id,
            'perihal' => $this->lpj->perihal,
            'unit' => $this->lpj->unit,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'is_final' => $this->isFinal,
            'message' => $message,
            'icon' => 'check-circle',
            'color' => 'green',
        ];
    }
}
