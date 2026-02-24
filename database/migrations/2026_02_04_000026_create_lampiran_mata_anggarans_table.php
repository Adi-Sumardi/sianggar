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
        Schema::create('lampiran_mata_anggarans', function (Blueprint $table) {
            $table->id();
            $table->string('no_pengajuan')->nullable();
            $table->foreignId('detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans');
            $table->foreignId('sub_mata_anggaran_id')->nullable()->constrained('sub_mata_anggarans');
            $table->foreignId('mata_anggaran_id')->nullable()->constrained('mata_anggarans');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lampiran_mata_anggarans');
    }
};
