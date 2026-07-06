<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PerubahanAnggaran;
use App\Models\User;
use App\Notifications\Concerns\FormatsPerubahanWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke pembuat saat perubahan (geser) anggaran diminta revisi.
 */
class PerubahanRevisedNotification extends Notification
{
    use FormatsPerubahanWa;

    public function __construct(
        public readonly PerubahanAnggaran $perubahan,
        public readonly User $approver,
        public readonly string $catatan = '',
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
        $msg = "⚠️ *Notification*\n*#Geser Anggaran Perlu Revisi*\n\n" . $this->waPerubahanDetail($this->perubahan);
        if ($this->catatan !== '') {
            $msg .= "\n\nCatatan : {$this->catatan}";
        }

        return $msg;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = "Perubahan anggaran {$this->perubahan->nomor_perubahan} perlu direvisi.";
        if ($this->catatan !== '') {
            $message .= " Catatan: {$this->catatan}";
        }

        return [
            'type' => 'perubahan_revised',
            'perubahan_id' => $this->perubahan->id,
            'nomor' => $this->perubahan->nomor_perubahan,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'catatan' => $this->catatan,
            'message' => $message,
            'icon' => 'edit',
            'color' => 'warning',
        ];
    }
}
