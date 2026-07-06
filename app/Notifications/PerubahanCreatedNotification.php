<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PerubahanAnggaran;
use App\Notifications\Concerns\FormatsPerubahanWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke pembuat saat perubahan (geser) anggaran berhasil diajukan.
 */
class PerubahanCreatedNotification extends Notification
{
    use FormatsPerubahanWa;

    public function __construct(
        public readonly PerubahanAnggaran $perubahan,
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
        $waktu = optional($this->perubahan->created_at)->format('d-m-Y : H:i') ?: '-';

        return "🔔 *Notification*\n*#Geser Anggaran Berhasil Dibuat* 📨\n\n"
            . "Waktu : {$waktu}\n"
            . $this->waPerubahanDetail($this->perubahan);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'perubahan_created',
            'perubahan_id' => $this->perubahan->id,
            'nomor' => $this->perubahan->nomor_perubahan,
            'perihal' => $this->perubahan->perihal,
            'message' => "Perubahan anggaran {$this->perubahan->nomor_perubahan} berhasil dibuat dan diajukan untuk approval.",
            'icon' => 'git-compare-arrows',
            'color' => 'primary',
        ];
    }
}
