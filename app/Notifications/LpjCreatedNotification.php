<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Lpj;
use App\Notifications\Concerns\FormatsLpjWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke pembuat saat LPJ berhasil diajukan untuk approval.
 */
class LpjCreatedNotification extends Notification
{
    use FormatsLpjWa;

    public function __construct(
        public readonly Lpj $lpj,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', \App\Channels\SaungWaChannel::class];
    }

    public function toSaungWa(object $notifiable): string
    {
        $waktu = optional($this->lpj->created_at)->format('d-m-Y : H:i') ?: '-';

        return "🔔 *Notification*\n*#LPJ Berhasil Dibuat* 📨\n\n"
            . "Waktu : {$waktu}\n"
            . $this->waLpjDetail($this->lpj);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lpj_created',
            'lpj_id' => $this->lpj->id,
            'perihal' => $this->lpj->perihal,
            'unit' => $this->lpj->unit,
            'message' => "LPJ \"{$this->lpj->perihal}\" berhasil dibuat dan diajukan untuk approval.",
            'icon' => 'clipboard-check',
            'color' => 'purple',
        ];
    }
}
