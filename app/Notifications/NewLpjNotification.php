<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\LpjApprovalStage;
use App\Models\Lpj;
use App\Notifications\Concerns\FormatsLpjWa;
use Illuminate\Notifications\Notification;

class NewLpjNotification extends Notification
{
    use FormatsLpjWa;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly Lpj $lpj,
        public readonly LpjApprovalStage $stage,
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
        return "🔔 *Notification*\n*#LPJ Menunggu Persetujuan* 📥\nTahap : {$this->stage->label()}\n\n"
            . $this->waLpjDetail($this->lpj);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_lpj',
            'lpj_id' => $this->lpj->id,
            'perihal' => $this->lpj->perihal,
            'unit' => $this->lpj->unit,
            'stage' => $this->stage->value,
            'stage_label' => $this->stage->label(),
            'message' => "LPJ baru \"{$this->lpj->perihal}\" menunggu persetujuan Anda pada tahap {$this->stage->label()}",
            'icon' => 'clipboard-check',
            'color' => 'purple',
        ];
    }
}
