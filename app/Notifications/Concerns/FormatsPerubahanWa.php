<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Models\PerubahanAnggaran;

/**
 * Helper format pesan WhatsApp untuk notifikasi perubahan (geser) anggaran.
 */
trait FormatsPerubahanWa
{
    /**
     * Blok detail perubahan anggaran (Unit, Nomor, Perihal, Total).
     */
    protected function waPerubahanDetail(PerubahanAnggaran $p): string
    {
        $unit = $p->unitRelation?->nama ?: '-';
        $total = 'Rp. ' . number_format((float) $p->total_amount, 0, ',', '.');

        return implode("\n", [
            "Unit : {$unit}",
            'Nomor : ' . ($p->nomor_perubahan ?: '-'),
            'Perihal : ' . ($p->perihal ?: '-'),
            "Total Geser Anggaran : {$total}",
        ]);
    }
}
