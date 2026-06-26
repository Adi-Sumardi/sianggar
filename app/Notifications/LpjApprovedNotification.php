<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Lpj;
use App\Models\User;
use App\Notifications\Concerns\FormatsLpjWa;
use Illuminate\Notifications\Notification;

class LpjApprovedNotification extends Notification
{
    use FormatsLpjWa;

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
        return ['database', \App\Channels\SaungWaChannel::class];
    }

    public function toSaungWa(object $notifiable): string
    {
        if ($this->isFinal) {
            return "✅ *Notification*\n*#LPJ Disetujui Sepenuhnya*\nOleh : {$this->approver->name}\n\n"
                . $this->waLpjDetail($this->lpj);
        }

        return "✅ *Notification*\n*#LPJ Disetujui*\nOleh : {$this->approver->name} (dilanjutkan ke tahap berikutnya)\n\n"
            . $this->waLpjDetail($this->lpj);
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
