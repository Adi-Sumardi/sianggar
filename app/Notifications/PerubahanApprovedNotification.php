<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PerubahanAnggaran;
use App\Models\User;
use App\Notifications\Concerns\FormatsPerubahanWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke pembuat saat perubahan (geser) anggaran disetujui penuh
 * (transfer anggaran sudah dieksekusi Bendahara).
 */
class PerubahanApprovedNotification extends Notification
{
    use FormatsPerubahanWa;

    public function __construct(
        public readonly PerubahanAnggaran $perubahan,
        public readonly User $approver,
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
        return "✅ *Notification*\n*#Geser Anggaran Disetujui Sepenuhnya*\nTransfer anggaran telah dieksekusi.\nOleh : {$this->approver->name}\n\n"
            . $this->waPerubahanDetail($this->perubahan);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'perubahan_fully_approved',
            'perubahan_id' => $this->perubahan->id,
            'nomor' => $this->perubahan->nomor_perubahan,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'message' => "Perubahan anggaran {$this->perubahan->nomor_perubahan} disetujui sepenuhnya dan transfer telah dieksekusi.",
            'icon' => 'check-circle',
            'color' => 'success',
        ];
    }
}
