<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\ApprovalStage;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Notifications\Notification;

class ProposalApprovedNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
        public readonly ?User $approver = null,
        public readonly ?ApprovalStage $stage = null,
        public readonly bool $isFullyApproved = false,
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
        if ($this->isFullyApproved) {
            return [
                'type' => 'proposal_fully_approved',
                'pengajuan_id' => $this->pengajuan->id,
                'nomor' => $this->pengajuan->nomor,
                'message' => "Pengajuan {$this->pengajuan->nomor} telah disetujui sepenuhnya dan siap diproses",
                'icon' => 'check-circle',
                'color' => 'success',
            ];
        }

        $approverName = $this->approver?->name ?? 'Sistem';
        $stageLabel = $this->stage?->label() ?? '-';

        return [
            'type' => 'proposal_approved',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor,
            'approver_id' => $this->approver?->id,
            'approver_name' => $approverName,
            'stage' => $this->stage?->value,
            'message' => "Pengajuan {$this->pengajuan->nomor} telah disetujui oleh {$approverName} pada tahap {$stageLabel}",
            'icon' => 'check',
            'color' => 'info',
        ];
    }
}
