<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Tambah kolom ulid pada lpjs, perubahan_anggarans, dan emails sebagai
     * identifier publik (URL/route binding), menyusul pengajuan_anggarans.
     */
    private array $tables = ['lpjs', 'perubahan_anggarans', 'emails'];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->char('ulid', 26)->nullable()->unique()->after('id');
            });

            DB::table($tableName)->whereNull('ulid')->orderBy('id')
                ->chunkById(200, function ($rows) use ($tableName) {
                    foreach ($rows as $row) {
                        DB::table($tableName)
                            ->where('id', $row->id)
                            ->update(['ulid' => (string) Str::ulid()]);
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropUnique(['ulid']);
                $table->dropColumn('ulid');
            });
        }
    }
};
