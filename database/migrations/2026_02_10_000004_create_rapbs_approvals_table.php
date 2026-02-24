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
        Schema::create('rapbs_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rapbs_id')->constrained('rapbs')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->string('stage', 30); // direktur, sekretariat, keuangan, sekretaris, wakil_ketua, ketum, bendahara
            $table->integer('stage_order');
            $table->string('status', 20)->default('pending'); // pending, approved, revised, rejected
            $table->text('notes')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();

            $table->index(['rapbs_id', 'stage_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapbs_approvals');
    }
};
