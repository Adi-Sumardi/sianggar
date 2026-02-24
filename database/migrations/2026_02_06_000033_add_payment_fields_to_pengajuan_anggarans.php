<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->string('payment_recipient')->nullable()->after('print_status');
            $table->string('payment_method')->nullable()->after('payment_recipient');
            $table->text('payment_notes')->nullable()->after('payment_method');
            $table->timestamp('paid_at')->nullable()->after('payment_notes');
            $table->foreignId('paid_by')->nullable()->after('paid_at')->constrained('users');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->dropForeign(['paid_by']);
            $table->dropColumn([
                'payment_recipient',
                'payment_method',
                'payment_notes',
                'paid_at',
                'paid_by',
            ]);
        });
    }
};
