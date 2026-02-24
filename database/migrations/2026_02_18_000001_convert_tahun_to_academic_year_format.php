<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that have a `tahun` string column to be converted.
     */
    private array $tables = [
        'mata_anggarans',
        'detail_mata_anggarans',
        'apbs',
        'penerimaans',
        'realisasi_anggarans',
        'pengajuan_anggarans',
        'lpjs',
        'pkts',
        'rapbs',
        'perubahan_anggarans',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // A. Widen perubahan_anggarans.tahun from string(4) to string(9)
        Schema::table('perubahan_anggarans', function (Blueprint $table) {
            $table->string('tahun', 9)->change();
        });

        // B. Transform existing data in all tables: "2026" → "2025/2026"
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            DB::table($table)
                ->whereRaw("LENGTH(tahun) <= 4 AND tahun NOT LIKE '%/%'")
                ->whereNotNull('tahun')
                ->update([
                    'tahun' => DB::raw("CONCAT(CAST(tahun AS UNSIGNED) - 1, '/', tahun)"),
                ]);
        }

        // C. Update fiscal_years table: replace `year` (YEAR type) with `tahun` (string)
        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->string('tahun', 9)->after('id')->nullable();
        });

        // Migrate fiscal_years data
        DB::table('fiscal_years')->get()->each(function ($row) {
            $yearInt = (int) $row->year;
            $startMonth = $row->start_date ? (int) date('n', strtotime($row->start_date)) : 1;

            if ($startMonth >= 7) {
                $tahun = $yearInt . '/' . ($yearInt + 1);
            } else {
                $tahun = ($yearInt - 1) . '/' . $yearInt;
            }

            DB::table('fiscal_years')->where('id', $row->id)->update(['tahun' => $tahun]);
        });

        // Make tahun required and drop old year column
        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->string('tahun', 9)->nullable(false)->change();
            $table->dropColumn('year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore fiscal_years.year column
        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->year('year')->after('id')->nullable();
        });

        DB::table('fiscal_years')->get()->each(function ($row) {
            if ($row->tahun && str_contains($row->tahun, '/')) {
                $endYear = (int) explode('/', $row->tahun)[1];
                DB::table('fiscal_years')->where('id', $row->id)->update(['year' => $endYear]);
            }
        });

        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->year('year')->nullable(false)->change();
            $table->dropColumn('tahun');
        });

        // Reverse data: "2025/2026" → "2026" (extract end year)
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            DB::table($table)
                ->whereRaw("tahun LIKE '%/%'")
                ->update([
                    'tahun' => DB::raw("SUBSTRING_INDEX(tahun, '/', -1)"),
                ]);
        }

        // Narrow perubahan_anggarans.tahun back to string(4)
        Schema::table('perubahan_anggarans', function (Blueprint $table) {
            $table->string('tahun', 4)->change();
        });
    }
};
