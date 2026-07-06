<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\ApprovalStage;
use App\Models\PengajuanAnggaran;
use App\Notifications\Concerns\FormatsPengajuanWa;
use Illuminate\Notifications\Notification;

class NewProposalNotification extends Notification
{
    use FormatsPengajuanWa;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
        public readonly ApprovalStage $stage,
        public readonly bool $isResubmit = false,
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
        if ($this->isResubmit) {
            return "🔔 *Notification*\n*#Pengajuan Telah Direvisi* 🔁\nSudah diperbaiki pembuat dan dapat ditinjau kembali.\nTahap : {$this->stage->label()}\n\n"
                . $this->waPengajuanDetail($this->pengajuan);
        }

        return "🔔 *Notification*\n*#Pengajuan Menunggu Persetujuan* 📥\nTahap : {$this->stage->label()}\n\n"
            . $this->waPengajuanDetail($this->pengajuan);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = $this->isResubmit
            ? "Pengajuan {$this->pengajuan->no_surat} telah direvisi dan dapat ditinjau kembali pada tahap {$this->stage->label()}"
            : "Pengajuan baru {$this->pengajuan->no_surat} menunggu persetujuan Anda pada tahap {$this->stage->label()}";

        return [
            'type' => $this->isResubmit ? 'proposal_resubmitted' : 'new_proposal',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor_pengajuan,
            'perihal' => $this->pengajuan->perihal,
            'stage' => $this->stage->value,
            'stage_label' => $this->stage->label(),
            'creator_id' => $this->pengajuan->user_id,
            'message' => $message,
            'icon' => 'file-text',
            'color' => 'primary',
        ];
    }
}
