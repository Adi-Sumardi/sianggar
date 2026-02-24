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
        Schema::create('apbs_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apbs_id')->constrained('apbs')->onDelete('cascade');
            $table->foreignId('rapbs_item_id')->nullable()->constrained('rapbs_items')->nullOnDelete();
            $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
            $table->foreignId('detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans')->nullOnDelete();
            $table->string('kode_coa', 50);
            $table->string('nama', 255);
            $table->decimal('anggaran', 15, 2)->default(0);
            $table->decimal('realisasi', 15, 2)->default(0);
            $table->decimal('sisa', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apbs_items');
    }
};
