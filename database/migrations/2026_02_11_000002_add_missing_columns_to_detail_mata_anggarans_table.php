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
            if (! Schema::hasColumn('detail_mata_anggarans', 'kode')) {
                $table->string('kode')->nullable()->after('tahun');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'nama')) {
                $table->string('nama')->nullable()->after('kode');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'volume')) {
                $table->decimal('volume', 15, 2)->nullable()->after('nama');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'satuan')) {
                $table->string('satuan')->nullable()->after('volume');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'harga_satuan')) {
                $table->decimal('harga_satuan', 15, 2)->nullable()->after('satuan');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'jumlah')) {
                $table->decimal('jumlah', 15, 2)->nullable()->after('harga_satuan');
            }
            if (! Schema::hasColumn('detail_mata_anggarans', 'keterangan')) {
                $table->text('keterangan')->nullable()->after('jumlah');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_mata_anggarans', function (Blueprint $table) {
            $columns = ['kode', 'nama', 'volume', 'satuan', 'harga_satuan', 'jumlah', 'keterangan'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('detail_mata_anggarans', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
