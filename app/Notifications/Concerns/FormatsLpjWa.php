<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Models\Lpj;

/**
 * Helper format pesan WhatsApp untuk notifikasi LPJ.
 */
trait FormatsLpjWa
{
    /**
     * Blok detail LPJ (Unit, No. Surat, Perihal, Tgl Kegiatan, Jumlah).
     */
    protected function waLpjDetail(Lpj $lpj): string
    {
        $jumlah = 'Rp. ' . number_format((float) $lpj->jumlah_pengajuan_total, 0, ',', '.');
        $tgl = $lpj->tgl_kegiatan;
        $tglStr = $tgl instanceof \DateTimeInterface ? $tgl->format('Y-m-d') : ($tgl ?: '-');

        return implode("\n", [
            'Unit : ' . ($lpj->unit ?: '-'),
            'No. Surat : ' . ($lpj->no_surat ?: '-'),
            'Perihal : ' . ($lpj->perihal ?: '-'),
            "Tgl. Kegiatan : {$tglStr}",
            "Jumlah : {$jumlah}",
        ]);
    }
}
