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
        Schema::create('rapbs_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rapbs_id')->constrained('rapbs')->onDelete('cascade');
            $table->foreignId('pkt_id')->nullable()->constrained('pkts')->onDelete('set null');
            $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
            $table->foreignId('sub_mata_anggaran_id')->nullable()->constrained('sub_mata_anggarans')->nullOnDelete();
            $table->foreignId('detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans')->nullOnDelete();
            $table->string('kode_coa', 50);
            $table->string('nama', 255);
            $table->text('uraian')->nullable();
            $table->decimal('volume', 10, 2)->default(1);
            $table->string('satuan', 50)->nullable();
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->decimal('jumlah', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapbs_items');
    }
};
