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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama');
            $table->string('tipe'); // aset|kewajiban|ekuitas|pendapatan|beban
            $table->string('saldo_normal'); // debit|kredit
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->onDelete('set null');
            $table->foreignId('unit_id')->nullable()->constrained('units')->onDelete('cascade');
            $table->boolean('is_postable')->default(true);
            $table->boolean('aktif')->default(true);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['tipe']);
            $table->index(['unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
