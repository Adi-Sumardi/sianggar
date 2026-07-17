<?php

declare(strict_types=1);

use App\Models\PengajuanAnggaran;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data migration (bukan schema): kolom journal_entries.no_bukti baru mulai
 * diisi dari PengajuanAnggaran::no_voucher sejak postFromPengajuanPaid()
 * diperbarui (lihat commit sebelumnya) - entry yang sudah ada SEBELUM
 * perubahan itu tetap kosong ("-") karena no_bukti cuma diisi saat create,
 * tidak retroaktif. Backfill ini mengisi entry lama yang sumbernya
 * PengajuanAnggaran dan no_bukti-nya masih null.
 */
return new class extends Migration
{
    public function up(): void
    {
        $entries = DB::table('journal_entries')
            ->where('sumber_type', PengajuanAnggaran::class)
            ->whereNull('no_bukti')
            ->get(['id', 'sumber_id']);

        foreach ($entries as $entry) {
            $noVoucher = DB::table('pengajuan_anggarans')
                ->where('id', $entry->sumber_id)
                ->value('no_voucher');

            if ($noVoucher === null) {
                continue;
            }

            // no_bukti unique - lewati kalau kebetulan sudah dipakai entry lain
            // (semestinya tidak terjadi, satu pengajuan = satu entry Paid).
            $alreadyUsed = DB::table('journal_entries')
                ->where('no_bukti', $noVoucher)
                ->where('id', '!=', $entry->id)
                ->exists();

            if ($alreadyUsed) {
                continue;
            }

            DB::table('journal_entries')
                ->where('id', $entry->id)
                ->update(['no_bukti' => $noVoucher]);
        }
    }

    public function down(): void
    {
        // No-op, murni perbaikan data.
    }
};
