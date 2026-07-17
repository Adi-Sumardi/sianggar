<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data migration (bukan schema): fitur "Draft -> Posting manual" untuk
 * jurnal Buku Besar sempat live singkat lalu di-revert kembali ke
 * auto-posted (lihat commit sebelumnya). Selama fitur itu aktif, LPJ/Paid/
 * Penerimaan/Jurnal Manual yang tercipta akan tersimpan berstatus 'draft'
 * dan TIDAK IKUT TERHITUNG di laporan (getAccountMutations filter status
 * posted). Backfill ini mem-posting semua entry yang kelanjur draft supaya
 * tidak ada data yang "hilang" dari laporan setelah tombol Posting manual
 * dihapus dari UI.
 */
return new class extends Migration
{
    public function up(): void
    {
        // NOW() itu fungsi khusus MySQL (tidak ada di SQLite yang dipakai
        // test) - pakai literal timestamp dari PHP supaya query-nya
        // lintas-driver.
        $now = now()->toDateTimeString();

        DB::table('journal_entries')
            ->where('status', 'draft')
            ->update([
                'status' => 'posted',
                'posted_at' => DB::raw("COALESCE(posted_at, created_at, '{$now}')"),
                'posted_by' => DB::raw('COALESCE(posted_by, created_by)'),
            ]);
    }

    public function down(): void
    {
        // Tidak ada cara aman membedakan entry yang "memang" posted dari
        // yang di-backfill dari draft — no-op, ini murni perbaikan data.
    }
};
