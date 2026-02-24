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
        Schema::create('detail_mata_anggarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans')->onDelete('cascade');
            $table->foreignId('sub_mata_anggaran_id')->constrained('sub_mata_anggarans')->onDelete('cascade');
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->foreignId('pkt_id')->nullable()->constrained('pkts')->onDelete('set null');
            $table->string('tahun');
            $table->decimal('anggaran_awal', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('saldo_dipakai', 15, 2)->default(0);
            $table->decimal('realisasi_year', 15, 2)->default(0);
            $table->timestamps();

            $table->index(['unit_id', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_mata_anggarans');
    }
};
