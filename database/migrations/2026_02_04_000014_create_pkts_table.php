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
        Schema::create('pkts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('strategy_id')->constrained('strategies');
            $table->foreignId('indikator_id')->constrained('indikators');
            $table->foreignId('proker_id')->constrained('prokers');
            $table->foreignId('kegiatan_id')->constrained('kegiatans');
            $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
            $table->foreignId('sub_mata_anggaran_id')->nullable()->constrained('sub_mata_anggarans');
            $table->string('tahun');
            $table->string('unit');
            $table->text('deskripsi_kegiatan')->nullable();
            $table->text('tujuan_kegiatan')->nullable();
            $table->decimal('saldo_anggaran', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pkts');
    }
};
