<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\ApprovalStage;
use App\Models\PerubahanAnggaran;
use App\Notifications\Concerns\FormatsPerubahanWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke approver saat perubahan (geser) anggaran menunggu persetujuan
 * (baru maupun setelah direvisi pembuat).
 */
class NewPerubahanNotification extends Notification
{
    use FormatsPerubahanWa;

    public function __construct(
        public readonly PerubahanAnggaran $perubahan,
        public readonly ApprovalStage $stage,
        public readonly bool $isResubmit = false,
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
        if ($this->isResubmit) {
            return "🔔 *Notification*\n*#Geser Anggaran Telah Direvisi* 🔁\nSudah diperbaiki pembuat dan dapat ditinjau kembali.\nTahap : {$this->stage->label()}\n\n"
                . $this->waPerubahanDetail($this->perubahan);
        }

        return "🔔 *Notification*\n*#Geser Anggaran Menunggu Persetujuan* 📥\nTahap : {$this->stage->label()}\n\n"
            . $this->waPerubahanDetail($this->perubahan);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = $this->isResubmit
            ? "Perubahan anggaran {$this->perubahan->nomor_perubahan} telah direvisi dan dapat ditinjau kembali pada tahap {$this->stage->label()}"
            : "Perubahan anggaran {$this->perubahan->nomor_perubahan} menunggu persetujuan Anda pada tahap {$this->stage->label()}";

        return [
            'type' => $this->isResubmit ? 'perubahan_resubmitted' : 'new_perubahan',
            'perubahan_id' => $this->perubahan->id,
            'nomor' => $this->perubahan->nomor_perubahan,
            'perihal' => $this->perubahan->perihal,
            'stage' => $this->stage->value,
            'stage_label' => $this->stage->label(),
            'message' => $message,
            'icon' => 'git-compare-arrows',
            'color' => 'primary',
        ];
    }
}
