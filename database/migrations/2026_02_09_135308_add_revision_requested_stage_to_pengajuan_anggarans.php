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
            // Track which stage requested revision so we can return to it after resubmit
            $table->string('revision_requested_stage')->nullable()->after('current_approval_stage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->dropColumn('revision_requested_stage');
        });
    }
};
