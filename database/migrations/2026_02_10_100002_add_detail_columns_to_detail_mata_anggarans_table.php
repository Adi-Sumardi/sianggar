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
        Schema::table('detail_mata_anggarans', function (Blueprint $table) {
            // Make sub_mata_anggaran_id nullable (since detail can be directly under mata_anggaran)
            $table->foreignId('sub_mata_anggaran_id')->nullable()->change();

            // Add detail columns
            $table->string('kode', 50)->nullable()->after('pkt_id');
            $table->string('nama', 255)->nullable()->after('kode');
            $table->decimal('volume', 15, 2)->nullable()->after('tahun');
            $table->string('satuan', 50)->nullable()->after('volume');
            $table->decimal('harga_satuan', 15, 2)->nullable()->after('satuan');
            $table->decimal('jumlah', 15, 2)->nullable()->after('harga_satuan');
            $table->text('keterangan')->nullable()->after('jumlah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_mata_anggarans', function (Blueprint $table) {
            $table->dropColumn(['kode', 'nama', 'volume', 'satuan', 'harga_satuan', 'jumlah', 'keterangan']);
        });
    }
};
