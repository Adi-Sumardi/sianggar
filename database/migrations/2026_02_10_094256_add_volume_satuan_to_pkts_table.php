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
            $table->decimal('volume', 10, 2)->default(1)->after('saldo_anggaran');
            $table->string('satuan', 50)->default('paket')->after('volume');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pkts', function (Blueprint $table) {
            $table->dropColumn(['volume', 'satuan']);
        });
    }
};
