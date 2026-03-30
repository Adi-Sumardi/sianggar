<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Notifications\Notification;

class ProposalRevisedNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
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
        return ['database', \App\Channels\SaungWaChannel::class];
    }

    public function toSaungWa(object $notifiable): string
    {
        $msg = "⚠️ *SIANGGAR*\nPengajuan {$this->pengajuan->nomor} perlu direvisi.";
        if ($this->catatan !== '') {
            $msg .= "\n\nCatatan: {$this->catatan}";
        }
        return $msg;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = "Pengajuan {$this->pengajuan->nomor} perlu direvisi.";

        if ($this->catatan !== '') {
            $message .= " Catatan: {$this->catatan}";
        }

        return [
            'type' => 'proposal_revised',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'catatan' => $this->catatan,
            'message' => $message,
            'icon' => 'edit',
            'color' => 'warning',
        ];
    }
}
