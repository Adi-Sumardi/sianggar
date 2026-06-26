<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Models\PengajuanAnggaran;

/**
 * Helper format pesan WhatsApp untuk notifikasi pengajuan.
 * Menyusun blok detail yang konsisten di semua notifikasi pengajuan.
 */
trait FormatsPengajuanWa
{
    /**
     * Blok detail pengajuan (Unit, No. Surat, Perihal, Tgl Kegiatan, Jumlah).
     */
    protected function waPengajuanDetail(PengajuanAnggaran $p): string
    {
        $unit   = $p->unitRelation?->nama ?: ($p->unit ?: '-');
        $jumlah = 'Rp. ' . number_format((float) $p->jumlah_pengajuan_total, 0, ',', '.');

        return implode("\n", [
            "Unit : {$unit}",
            'No. Surat : ' . ($p->no_surat ?: '-'),
            'Perihal : ' . ($p->perihal ?: '-'),
            'Tgl. Kegiatan : ' . ($p->waktu_kegiatan ?: '-'),
            "Jumlah Pengajuan : {$jumlah}",
        ]);
    }

    /**
     * Waktu pembuatan pengajuan, format: 26-06-2026 : 14:11
     */
    protected function waWaktuPengajuan(PengajuanAnggaran $p): string
    {
        return optional($p->created_at)->format('d-m-Y : H:i') ?: '-';
    }
}
