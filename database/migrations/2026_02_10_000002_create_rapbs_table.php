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
        Schema::create('rapbs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->string('tahun', 10); // '2025/2026'
            $table->decimal('total_anggaran', 15, 2)->default(0);
            $table->string('status', 20)->default('draft'); // draft, submitted, in_review, approved, rejected
            $table->string('current_approval_stage', 30)->nullable(); // direktur, keuangan, sekretaris, etc.
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['unit_id', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapbs');
    }
};
