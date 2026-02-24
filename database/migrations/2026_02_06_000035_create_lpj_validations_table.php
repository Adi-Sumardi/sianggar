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
        Schema::create('lpj_validations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lpj_id')->constrained('lpjs')->onDelete('cascade');
            $table->foreignId('validated_by')->constrained('users');

            // Checklist items (5 required items per flow-lpj.md)
            $table->boolean('has_activity_identity')->default(false);      // Identitas kegiatan
            $table->boolean('has_cover_letter')->default(false);           // Surat pengantar LPJ
            $table->boolean('has_narrative_report')->default(false);       // Laporan naratif capaian
            $table->boolean('has_financial_report')->default(false);       // Laporan keuangan
            $table->boolean('has_receipts')->default(false);               // Kuitansi/bukti pengeluaran

            // Routing
            $table->string('reference_type'); // education, hr_general, secretariat

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('lpj_id'); // One validation per LPJ
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lpj_validations');
    }
};
