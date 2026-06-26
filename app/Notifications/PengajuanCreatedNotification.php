<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PengajuanAnggaran;
use App\Notifications\Concerns\FormatsPengajuanWa;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke pembuat pengajuan saat pengajuan berhasil diajukan untuk approval.
 */
class PengajuanCreatedNotification extends Notification
{
    use FormatsPengajuanWa;

    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
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
        return "🔔 *Notification*\n*#Pengajuan Berhasil Dibuat* 📨\n\n"
            . "Waktu Pengajuan : {$this->waWaktuPengajuan($this->pengajuan)}\n"
            . $this->waPengajuanDetail($this->pengajuan);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'pengajuan_created',
            'pengajuan_id' => $this->pengajuan->id,
            'nomor' => $this->pengajuan->nomor_pengajuan,
            'perihal' => $this->pengajuan->perihal,
            'creator_id' => $this->pengajuan->user_id,
            'message' => "Pengajuan {$this->pengajuan->no_surat} berhasil dibuat dan diajukan untuk approval.",
            'icon' => 'file-text',
            'color' => 'primary',
        ];
    }
}
