<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\LpjApproved;
use App\Models\RealisasiAnggaran;
use Illuminate\Support\Carbon;

class SyncRealisasiFromLpj
{
    /**
     * Buat baris RealisasiAnggaran otomatis saat LPJ disetujui final, supaya
     * Laporan Semester (CAWU) & Laporan Akuntansi terisi tanpa input manual.
     * Satu baris per LPJ (bukan diakumulasi per unit+bulan) - idempotent via
     * unique constraint lpj_id, aman kalau event ini ke-trigger ulang.
     */
    public function handle(LpjApproved $event): void
    {
        $lpj = $event->lpj;

        if (RealisasiAnggaran::where('lpj_id', $lpj->id)->exists()) {
            return;
        }

        $pengajuan = $lpj->pengajuanAnggaran;
        $unitId = $pengajuan?->unit_id;

        if (! $unitId) {
            return;
        }

        $jumlahAnggaran = (float) $lpj->jumlah_pengajuan_total;
        $jumlahRealisasi = (float) $lpj->input_realisasi;
        $sisa = $jumlahAnggaran - $jumlahRealisasi;
        $persentase = $jumlahAnggaran > 0 ? round(($jumlahRealisasi / $jumlahAnggaran) * 100, 2) : 0;

        RealisasiAnggaran::create([
            'unit_id' => $unitId,
            'lpj_id' => $lpj->id,
            'tahun' => $lpj->tahun,
            'bulan' => Carbon::now()->locale('id')->translatedFormat('F'),
            'mata_anggaran' => $lpj->mata_anggaran ?: '-',
            'jumlah_anggaran' => $jumlahAnggaran,
            'jumlah_realisasi' => $jumlahRealisasi,
            'sisa' => $sisa,
            'persentase' => $persentase,
            'keterangan' => "Otomatis dari LPJ {$lpj->no_surat}",
        ]);
    }
}
