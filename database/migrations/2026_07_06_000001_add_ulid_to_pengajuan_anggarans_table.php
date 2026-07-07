<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Tambah kolom ulid pada pengajuan_anggarans sebagai identifier publik
     * (URL/route binding) agar ID numerik berurutan tidak terekspos.
     */
    public function up(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->char('ulid', 26)->nullable()->unique()->after('id');
        });

        // Backfill data lama
        DB::table('pengajuan_anggarans')->whereNull('ulid')->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('pengajuan_anggarans')
                        ->where('id', $row->id)
                        ->update(['ulid' => (string) Str::ulid()]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->dropUnique(['ulid']);
            $table->dropColumn('ulid');
        });
    }
};
