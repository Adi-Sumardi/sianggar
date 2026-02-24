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
        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            // Add type column: 'geser' for budget transfer, 'tambah' for add budget
            $table->enum('type', ['geser', 'tambah'])->default('geser')->after('perubahan_anggaran_id');
        });

        // Make source_detail_mata_anggaran_id nullable
        // Need to drop foreign key first, then modify column
        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->dropForeign(['source_detail_mata_anggaran_id']);
        });

        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->unsignedBigInteger('source_detail_mata_anggaran_id')->nullable()->change();
        });

        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->foreign('source_detail_mata_anggaran_id')
                ->references('id')
                ->on('detail_mata_anggarans')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert source_detail_mata_anggaran_id to NOT NULL
        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->dropForeign(['source_detail_mata_anggaran_id']);
        });

        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->unsignedBigInteger('source_detail_mata_anggaran_id')->nullable(false)->change();
        });

        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->foreign('source_detail_mata_anggaran_id')
                ->references('id')
                ->on('detail_mata_anggarans')
                ->onDelete('cascade');
        });

        // Drop type column
        Schema::table('perubahan_anggaran_items', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
