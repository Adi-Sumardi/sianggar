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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->date('tanggal');
            $table->string('no_bukti')->nullable()->unique();
            $table->foreignId('journal_id')->constrained('journals')->onDelete('restrict');
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->string('sumber_type')->nullable();
            $table->unsignedBigInteger('sumber_id')->nullable();
            $table->string('status')->default('draft'); // draft|posted|reversed
            $table->text('keterangan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('reversal_of_id')->nullable()->constrained('journal_entries')->onDelete('set null');
            $table->timestamps();

            $table->index(['unit_id', 'tanggal']);
            $table->index(['sumber_type', 'sumber_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
