<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Models\Email;

/**
 * Helper format pesan WhatsApp untuk notifikasi surat/email.
 */
trait FormatsEmailWa
{
    /**
     * Blok detail surat (Pengirim, No. Surat, Nama Surat, Tgl Surat).
     */
    protected function waEmailDetail(Email $email): string
    {
        $pengirim = $email->user?->name ?? 'Unknown';
        $tgl = $email->tgl_surat;
        $tglStr = $tgl instanceof \DateTimeInterface ? $tgl->format('Y-m-d') : ($tgl ?: '-');

        return implode("\n", [
            "Pengirim : {$pengirim}",
            'No. Surat : ' . ($email->no_surat ?: '-'),
            'Nama Surat : ' . ($email->name_surat ?: '-'),
            "Tgl. Surat : {$tglStr}",
        ]);
    }
}
