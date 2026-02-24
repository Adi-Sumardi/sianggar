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
        Schema::create('perubahan_anggaran_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perubahan_anggaran_id')->constrained()->onDelete('cascade');
            $table->foreignId('perubahan_anggaran_item_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('source_detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans')->onDelete('set null');
            $table->foreignId('target_detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans')->onDelete('set null');
            $table->decimal('source_saldo_before', 15, 2)->nullable();
            $table->decimal('source_saldo_after', 15, 2)->nullable();
            $table->decimal('target_saldo_before', 15, 2)->nullable();
            $table->decimal('target_saldo_after', 15, 2)->nullable();
            $table->decimal('amount', 15, 2);
            $table->foreignId('executed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->index('perubahan_anggaran_id');
            $table->index('executed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perubahan_anggaran_logs');
    }
};
