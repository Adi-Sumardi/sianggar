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
        Schema::create('detail_pengajuans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_anggaran_id')->constrained('pengajuan_anggarans')->onDelete('cascade');
            $table->foreignId('detail_mata_anggaran_id')->constrained('detail_mata_anggarans');
            $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
            $table->foreignId('sub_mata_anggaran_id')->nullable()->constrained('sub_mata_anggarans');
            $table->string('nama_item')->nullable();
            $table->decimal('jumlah', 15, 2)->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_pengajuans');
    }
};
