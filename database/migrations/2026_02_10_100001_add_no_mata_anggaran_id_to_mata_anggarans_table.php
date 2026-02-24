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
        Schema::table('mata_anggarans', function (Blueprint $table) {
            $table->foreignId('no_mata_anggaran_id')
                ->nullable()
                ->after('unit_id')
                ->constrained('no_mata_anggarans')
                ->onDelete('set null');

            $table->string('jenis')->nullable()->after('nama');
            $table->text('keterangan')->nullable()->after('jenis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mata_anggarans', function (Blueprint $table) {
            $table->dropForeign(['no_mata_anggaran_id']);
            $table->dropColumn(['no_mata_anggaran_id', 'jenis', 'keterangan']);
        });
    }
};
