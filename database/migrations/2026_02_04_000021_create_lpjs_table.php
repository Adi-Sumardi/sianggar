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
        Schema::create('lpjs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_anggaran_id')->constrained('pengajuan_anggarans')->onDelete('cascade');
            $table->string('unit');
            $table->string('no_surat')->nullable();
            $table->string('mata_anggaran')->nullable();
            $table->string('perihal');
            $table->string('no_mata_anggaran')->nullable();
            $table->decimal('jumlah_pengajuan_total', 15, 2)->default(0);
            $table->date('tgl_kegiatan')->nullable();
            $table->decimal('input_realisasi', 15, 2)->default(0);
            $table->text('deskripsi_singkat')->nullable();
            $table->string('proses')->default('draft');
            $table->string('current_approval_stage')->nullable();
            $table->string('status_revisi')->nullable();
            $table->string('tahun');
            $table->string('ditujukan')->nullable();
            $table->timestamps();

            $table->index(['unit', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lpjs');
    }
};
