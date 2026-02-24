<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mata_anggarans', function (Blueprint $table) {
            if (! Schema::hasColumn('mata_anggarans', 'apbs_tahun_lalu')) {
                $table->decimal('apbs_tahun_lalu', 20, 2)->default(0)->after('keterangan');
            }
            if (! Schema::hasColumn('mata_anggarans', 'asumsi_realisasi')) {
                $table->decimal('asumsi_realisasi', 20, 2)->default(0)->after('apbs_tahun_lalu');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mata_anggarans', function (Blueprint $table) {
            $table->dropColumn(['apbs_tahun_lalu', 'asumsi_realisasi']);
        });
    }
};
