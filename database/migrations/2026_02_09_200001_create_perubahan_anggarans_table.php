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
        Schema::create('perubahan_anggarans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_perubahan', 50)->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('unit_id')->nullable()->constrained()->onDelete('set null');
            $table->string('tahun', 4);
            $table->string('perihal', 255);
            $table->text('alasan');
            $table->string('submitter_type', 20)->nullable(); // 'unit' or 'substansi'
            $table->string('status', 30)->default('draft'); // draft, submitted, in-review, revision-required, rejected, completed
            $table->string('current_approval_stage', 50)->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['user_id', 'tahun']);
            $table->index(['unit_id', 'tahun']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perubahan_anggarans');
    }
};
