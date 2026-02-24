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
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->string('amount_category')->nullable()->after('jumlah_pengajuan_total');
            $table->string('reference_type')->nullable()->after('amount_category');
            $table->boolean('need_lpj')->default(false)->after('reference_type');
            $table->decimal('approved_amount', 15, 2)->nullable()->after('need_lpj');
            $table->string('submitter_type')->nullable()->after('approved_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->dropColumn([
                'amount_category',
                'reference_type',
                'need_lpj',
                'approved_amount',
                'submitter_type',
            ]);
        });
    }
};
