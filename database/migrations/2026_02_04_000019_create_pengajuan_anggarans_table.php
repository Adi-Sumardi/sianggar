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
        Schema::create('pengajuan_anggarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->string('tahun');
            $table->string('nomor_pengajuan')->nullable();
            $table->string('perihal')->nullable();
            $table->string('nama_pengajuan');
            $table->string('no_surat')->nullable();
            $table->string('tempat')->nullable();
            $table->string('waktu_kegiatan')->nullable();
            $table->string('unit');
            $table->decimal('jumlah_pengajuan_total', 15, 2)->default(0);
            $table->string('status_proses')->default('draft');
            $table->string('current_approval_stage')->nullable();
            $table->string('status_revisi')->nullable();
            $table->date('date_revisi')->nullable();
            $table->time('time_revisi')->nullable();
            $table->string('status_payment')->default('unpaid');
            $table->string('no_voucher')->nullable();
            $table->string('print_status')->default('unprinted');
            $table->timestamps();

            $table->index(['unit', 'tahun']);
            $table->index('status_proses');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_anggarans');
    }
};
