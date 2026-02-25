<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\ApprovalStage;
use App\Models\PengajuanAnggaran;
use Illuminate\Notifications\Notification;

class NewProposalNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
        public readonly ApprovalStage $stage,
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
        return [
            'type' => 'new_proposal',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor,
            'perihal' => $this->pengajuan->perihal,
            'stage' => $this->stage->value,
            'stage_label' => $this->stage->label(),
            'creator_id' => $this->pengajuan->user_id,
            'message' => "Pengajuan baru {$this->pengajuan->nomor} menunggu persetujuan Anda pada tahap {$this->stage->label()}",
            'icon' => 'file-text',
            'color' => 'primary',
        ];
    }
}
