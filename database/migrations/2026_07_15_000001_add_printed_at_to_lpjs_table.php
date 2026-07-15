<?php

declare(strict_types=1);

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
        Schema::table('lpjs', function (Blueprint $table) {
            $table->timestamp('printed_at')->nullable()->after('validation_notes');
            $table->foreignId('printed_by')->nullable()->after('printed_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lpjs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('printed_by');
            $table->dropColumn('printed_at');
        });
    }
};
