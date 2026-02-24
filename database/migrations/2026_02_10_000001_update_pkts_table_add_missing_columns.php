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
        Schema::table('pkts', function (Blueprint $table) {
            // Add unit_id foreign key
            $table->foreignId('unit_id')->nullable()->after('sub_mata_anggaran_id')->constrained('units')->nullOnDelete();

            // Add detail_mata_anggaran_id foreign key
            $table->foreignId('detail_mata_anggaran_id')->nullable()->after('unit_id')->constrained('detail_mata_anggarans')->nullOnDelete();

            // Add created_by foreign key
            $table->foreignId('created_by')->nullable()->after('saldo_anggaran')->constrained('users')->nullOnDelete();

            // Add status field
            $table->string('status', 20)->default('draft')->after('created_by');

            // Add catatan field
            $table->text('catatan')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pkts', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['detail_mata_anggaran_id']);
            $table->dropForeign(['created_by']);

            $table->dropColumn(['unit_id', 'detail_mata_anggaran_id', 'created_by', 'status', 'catatan']);
        });
    }
};
