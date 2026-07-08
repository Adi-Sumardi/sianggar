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
        Schema::create('mata_anggaran_jenis_account_maps', function (Blueprint $table) {
            $table->id();
            $table->string('jenis')->unique(); // pendapatan|belanja_pegawai|belanja_barang|belanja_modal|belanja_lainnya
            $table->foreignId('account_id')->constrained('accounts')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mata_anggaran_jenis_account_maps');
    }
};
