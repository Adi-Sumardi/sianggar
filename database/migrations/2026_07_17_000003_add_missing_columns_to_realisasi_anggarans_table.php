<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Perbaikan schema drift: tabel realisasi_anggarans cuma punya
 * id/unit_id/tahun/mata_anggaran/jumlah_realisasi (migration
 * 2026_02_04_000018), tapi App\Models\RealisasiAnggaran::$fillable dan
 * AccountingController::storeRealisasi() sudah lama mengharapkan kolom
 * bulan/jumlah_anggaran/sisa/persentase/keterangan yang tidak pernah ada -
 * bikin form input manual realisasi selalu gagal SQL "Unknown column".
 *
 * Sekalian tambah lpj_id (nullable, unique) untuk auto-sync realisasi dari
 * LPJ yang disetujui final (lihat SyncRealisasiFromLpj listener) - idempotent
 * guard supaya satu LPJ tidak bikin baris dobel kalau event ke-trigger ulang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('realisasi_anggarans', function (Blueprint $table) {
            $table->string('bulan')->nullable()->after('tahun');
            $table->decimal('jumlah_anggaran', 15, 2)->default(0)->after('bulan');
            $table->decimal('sisa', 15, 2)->default(0)->after('jumlah_realisasi');
            $table->decimal('persentase', 5, 2)->nullable()->after('sisa');
            $table->text('keterangan')->nullable()->after('persentase');
            $table->foreignId('lpj_id')->nullable()->unique()->after('id')
                ->constrained('lpjs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('realisasi_anggarans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lpj_id');
            $table->dropColumn(['bulan', 'jumlah_anggaran', 'sisa', 'persentase', 'keterangan']);
        });
    }
};
