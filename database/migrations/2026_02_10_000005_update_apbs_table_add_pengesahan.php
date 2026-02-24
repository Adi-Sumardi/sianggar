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
        Schema::table('apbs', function (Blueprint $table) {
            // Drop old column if exists
            if (Schema::hasColumn('apbs', 'mata_anggaran')) {
                $table->dropColumn('mata_anggaran');
            }
            if (Schema::hasColumn('apbs', 'jumlah_apbs')) {
                $table->dropColumn('jumlah_apbs');
            }

            // Add rapbs_id foreign key
            $table->foreignId('rapbs_id')->nullable()->after('unit_id')->constrained('rapbs')->nullOnDelete();

            // Add budget fields
            $table->decimal('total_anggaran', 15, 2)->default(0)->after('tahun');
            $table->decimal('total_realisasi', 15, 2)->default(0)->after('total_anggaran');
            $table->decimal('sisa_anggaran', 15, 2)->default(0)->after('total_realisasi');

            // Add pengesahan fields
            $table->string('nomor_dokumen', 50)->nullable()->after('sisa_anggaran');
            $table->date('tanggal_pengesahan')->nullable()->after('nomor_dokumen');
            $table->string('status', 20)->default('active')->after('tanggal_pengesahan'); // active, closed
            $table->text('keterangan')->nullable()->after('status');

            // Add signature fields
            $table->string('ttd_kepala_sekolah')->nullable();
            $table->string('ttd_bendahara')->nullable();
            $table->string('ttd_ketua_umum')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apbs', function (Blueprint $table) {
            $table->dropForeign(['rapbs_id']);
            $table->dropColumn([
                'rapbs_id',
                'total_anggaran',
                'total_realisasi',
                'sisa_anggaran',
                'nomor_dokumen',
                'tanggal_pengesahan',
                'status',
                'keterangan',
                'ttd_kepala_sekolah',
                'ttd_bendahara',
                'ttd_ketua_umum',
            ]);

            // Restore old columns
            $table->string('mata_anggaran')->nullable();
            $table->decimal('jumlah_apbs', 15, 2)->default(0);
        });
    }
};
