<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\ApprovalStage;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Notifications\Concerns\FormatsPengajuanWa;
use Illuminate\Notifications\Notification;

class ProposalApprovedNotification extends Notification
{
    use FormatsPengajuanWa;

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
        return ['database', \App\Channels\SaungWaChannel::class];
    }

    public function toSaungWa(object $notifiable): string
    {
        if ($this->isFullyApproved) {
            return "✅ *Notification*\n*#Pengajuan Selesai dan Sudah Dibayarkan*\n\n"
                . $this->waPengajuanDetail($this->pengajuan);
        }

        $approverName = $this->approver?->name ?? 'Sistem';
        $stageLabel   = $this->stage?->label() ?? '-';

        return "✅ *Notification*\n*#Pengajuan Disetujui*\nOleh : {$approverName} (tahap {$stageLabel})\n\n"
            . $this->waPengajuanDetail($this->pengajuan);
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
                'nomor' => $this->pengajuan->nomor_pengajuan,
                'message' => "Pengajuan {$this->pengajuan->no_surat} telah selesai dan sudah dibayarkan",
                'icon' => 'check-circle',
                'color' => 'success',
            ];
        }

        $approverName = $this->approver?->name ?? 'Sistem';
        $stageLabel = $this->stage?->label() ?? '-';

        return [
            'type' => 'proposal_approved',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor_pengajuan,
            'approver_id' => $this->approver?->id,
            'approver_name' => $approverName,
            'stage' => $this->stage?->value,
            'message' => "Pengajuan {$this->pengajuan->no_surat} telah disetujui oleh {$approverName} pada tahap {$stageLabel}",
            'icon' => 'check',
            'color' => 'info',
        ];
    }
}
