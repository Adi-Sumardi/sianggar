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
        Schema::table('lpjs', function (Blueprint $table) {
            // Routing field for LPJ approval
            $table->string('reference_type')->nullable()->after('current_approval_stage');

            // Validation tracking
            $table->timestamp('validated_at')->nullable()->after('reference_type');
            $table->foreignId('validated_by')->nullable()->after('validated_at')->constrained('users')->nullOnDelete();
            $table->text('validation_notes')->nullable()->after('validated_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lpjs', function (Blueprint $table) {
            $table->dropForeign(['validated_by']);
            $table->dropColumn([
                'reference_type',
                'validated_at',
                'validated_by',
                'validation_notes',
            ]);
        });
    }
};
