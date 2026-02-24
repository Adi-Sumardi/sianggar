<?php

declare(strict_types=1);

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
        Schema::create('perubahan_anggaran_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perubahan_anggaran_id')->constrained()->onDelete('cascade');
            $table->foreignId('source_detail_mata_anggaran_id')->constrained('detail_mata_anggarans')->onDelete('cascade');
            $table->foreignId('target_detail_mata_anggaran_id')->constrained('detail_mata_anggarans')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index('perubahan_anggaran_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perubahan_anggaran_items');
    }
};
