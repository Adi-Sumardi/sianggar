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
        Schema::table('detail_pengajuans', function (Blueprint $table) {
            if (! Schema::hasColumn('detail_pengajuans', 'uraian')) {
                $table->string('uraian')->nullable()->after('nama_item');
            }
            if (! Schema::hasColumn('detail_pengajuans', 'volume')) {
                $table->integer('volume')->nullable()->after('uraian');
            }
            if (! Schema::hasColumn('detail_pengajuans', 'satuan')) {
                $table->string('satuan')->nullable()->after('volume');
            }
            if (! Schema::hasColumn('detail_pengajuans', 'harga_satuan')) {
                $table->decimal('harga_satuan', 15, 2)->nullable()->after('satuan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_pengajuans', function (Blueprint $table) {
            $table->dropColumn(['uraian', 'volume', 'satuan', 'harga_satuan']);
        });
    }
};
