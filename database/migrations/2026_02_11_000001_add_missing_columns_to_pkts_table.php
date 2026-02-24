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
            if (! Schema::hasColumn('pkts', 'detail_mata_anggaran_id')) {
                $table->foreignId('detail_mata_anggaran_id')->nullable()->after('sub_mata_anggaran_id')->constrained('detail_mata_anggarans')->onDelete('set null');
            }
            if (! Schema::hasColumn('pkts', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->after('detail_mata_anggaran_id')->constrained('units')->onDelete('set null');
            }
            if (! Schema::hasColumn('pkts', 'volume')) {
                $table->decimal('volume', 15, 2)->nullable()->after('saldo_anggaran');
            }
            if (! Schema::hasColumn('pkts', 'satuan')) {
                $table->string('satuan')->nullable()->after('volume');
            }
            if (! Schema::hasColumn('pkts', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('satuan')->constrained('users')->onDelete('set null');
            }
            if (! Schema::hasColumn('pkts', 'status')) {
                $table->string('status')->default('draft')->after('created_by');
            }
            if (! Schema::hasColumn('pkts', 'catatan')) {
                $table->text('catatan')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pkts', function (Blueprint $table) {
            $columns = ['detail_mata_anggaran_id', 'unit_id', 'volume', 'satuan', 'created_by', 'status', 'catatan'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('pkts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
