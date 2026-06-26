<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Notifications\Concerns\FormatsPengajuanWa;
use Illuminate\Notifications\Notification;

class ProposalRejectedNotification extends Notification
{
    use FormatsPengajuanWa;

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
        $msg = "❌ *Notification*\n*#Pengajuan Ditolak*\nOleh : {$this->approver->name}\n\n"
            . $this->waPengajuanDetail($this->pengajuan);
        if ($this->catatan !== '') {
            $msg .= "\n\nAlasan : {$this->catatan}";
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
        $message = "Pengajuan {$this->pengajuan->no_surat} ditolak oleh {$this->approver->name}.";

        if ($this->catatan !== '') {
            $message .= " Alasan: {$this->catatan}";
        }

        return [
            'type' => 'proposal_rejected',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor_pengajuan,
            'approver_id' => $this->approver->id,
            'approver_name' => $this->approver->name,
            'catatan' => $this->catatan,
            'message' => $message,
            'icon' => 'x-circle',
            'color' => 'red',
        ];
    }
}
