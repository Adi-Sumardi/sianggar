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
        // Drop bagian_id foreign key and column from prokers
        Schema::table('prokers', function (Blueprint $table) {
            $table->dropForeign(['bagian_id']);
            $table->dropColumn('bagian_id');
        });

        // Drop bagian_id foreign key and column from kegiatans
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->dropForeign(['bagian_id']);
            $table->dropColumn('bagian_id');
        });

        // Drop the bagians table
        Schema::dropIfExists('bagians');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate bagians table
        Schema::create('bagians', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->timestamps();
        });

        // Re-add bagian_id to prokers
        Schema::table('prokers', function (Blueprint $table) {
            $table->foreignId('bagian_id')->nullable()->constrained('bagians')->onDelete('set null');
        });

        // Re-add bagian_id to kegiatans
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->foreignId('bagian_id')->nullable()->constrained('bagians')->onDelete('set null');
        });
    }
};
