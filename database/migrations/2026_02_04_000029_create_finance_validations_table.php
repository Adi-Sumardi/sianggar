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
        Schema::create('finance_validations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_anggaran_id')->constrained('pengajuan_anggarans')->onDelete('cascade');
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('valid_document')->default(false);
            $table->boolean('valid_calculation')->default(false);
            $table->boolean('valid_budget_code')->default(false);
            $table->boolean('reasonable_cost')->default(false);
            $table->boolean('reasonable_volume')->default(false);
            $table->boolean('reasonable_executor')->default(false);
            $table->string('reference_type')->nullable();
            $table->string('amount_category')->nullable();
            $table->boolean('need_lpj')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('pengajuan_anggaran_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_validations');
    }
};
