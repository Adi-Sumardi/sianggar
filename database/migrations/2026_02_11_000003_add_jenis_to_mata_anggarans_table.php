<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mata_anggarans', function (Blueprint $table) {
            if (! Schema::hasColumn('mata_anggarans', 'jenis')) {
                $table->string('jenis')->nullable()->after('tahun');
            }
            if (! Schema::hasColumn('mata_anggarans', 'keterangan')) {
                $table->text('keterangan')->nullable()->after('jenis');
            }
        });
    }

    public function down(): void
    {
        Schema::table('mata_anggarans', function (Blueprint $table) {
            if (Schema::hasColumn('mata_anggarans', 'jenis')) {
                $table->dropColumn('jenis');
            }
            if (Schema::hasColumn('mata_anggarans', 'keterangan')) {
                $table->dropColumn('keterangan');
            }
        });
    }
};
