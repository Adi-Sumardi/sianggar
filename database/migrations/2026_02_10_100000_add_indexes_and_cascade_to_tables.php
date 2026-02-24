<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        if (! Schema::hasTable($table)) {
            return true; // Pretend index exists if table doesn't exist
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");
            foreach ($indexes as $index) {
                if ($index->name === $indexName) {
                    return true;
                }
            }

            return false;
        }

        // MySQL/MariaDB
        $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);

        return count($indexes) > 0;
    }

    /**
     * Safely add index if table exists, columns exist, and index doesn't exist.
     */
    private function addIndexIfPossible(string $table, string $indexName, array|string $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        // Check if all columns exist
        $columnsArray = is_array($columns) ? $columns : [$columns];
        foreach ($columnsArray as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return;
            }
        }

        if ($this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($columns) {
            $tableBlueprint->index($columns);
        });
    }

    /**
     * Run the migrations.
     *
     * This migration adds:
     * - Missing indexes on frequently queried columns
     * - Cascade delete on critical foreign keys
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        // Skip foreign key modifications for SQLite (not fully supported)
        if ($driver === 'sqlite') {
            return;
        }

        // =========================================================================
        // Add Indexes for Performance (only if they don't exist)
        // =========================================================================

        $this->addIndexIfPossible('strategies', 'strategies_kode_index', 'kode');
        $this->addIndexIfPossible('bagians', 'bagians_nama_index', 'nama');
        $this->addIndexIfPossible('prokers', 'prokers_strategy_id_indikator_id_index', ['strategy_id', 'indikator_id']);
        $this->addIndexIfPossible('prokers', 'prokers_strategy_id_bagian_id_index', ['strategy_id', 'bagian_id']);
        $this->addIndexIfPossible('kegiatans', 'kegiatans_strategy_id_proker_id_index', ['strategy_id', 'proker_id']);
        $this->addIndexIfPossible('kegiatans', 'kegiatans_indikator_id_bagian_id_index', ['indikator_id', 'bagian_id']);
        $this->addIndexIfPossible('penerimaans', 'penerimaans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->addIndexIfPossible('realisasi_anggarans', 'realisasi_anggarans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->addIndexIfPossible('emails', 'emails_status_index', 'status');
        $this->addIndexIfPossible('pengajuan_anggarans', 'pengajuan_anggarans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->addIndexIfPossible('pengajuan_anggarans', 'pengajuan_anggarans_status_proses_index', 'status_proses');
        $this->addIndexIfPossible('detail_pengajuans', 'detail_pengajuans_pengajuan_anggaran_id_mata_anggaran_id_index', ['pengajuan_anggaran_id', 'mata_anggaran_id']);
        $this->addIndexIfPossible('approvals', 'approvals_approvable_type_approvable_id_index', ['approvable_type', 'approvable_id']);
        $this->addIndexIfPossible('approvals', 'approvals_status_index', 'status');

        // =========================================================================
        // Update Foreign Keys with Cascade Delete
        // =========================================================================

        // Prokers - add cascade delete
        if (Schema::hasTable('prokers')) {
            Schema::table('prokers', function (Blueprint $table) {
                if (Schema::hasColumn('prokers', 'strategy_id')) {
                    try {
                        $table->dropForeign(['strategy_id']);
                    } catch (\Exception $e) {
                        // Foreign key may not exist
                    }
                    $table->foreign('strategy_id')
                        ->references('id')
                        ->on('strategies')
                        ->onDelete('cascade');
                }
                if (Schema::hasColumn('prokers', 'indikator_id')) {
                    try {
                        $table->dropForeign(['indikator_id']);
                    } catch (\Exception $e) {
                        // Foreign key may not exist
                    }
                    $table->foreign('indikator_id')
                        ->references('id')
                        ->on('indikators')
                        ->onDelete('cascade');
                }
                // bagian_id was removed in a previous migration, skip it
            });
        }

        // Kegiatans - add cascade delete
        if (Schema::hasTable('kegiatans')) {
            Schema::table('kegiatans', function (Blueprint $table) {
                if (Schema::hasColumn('kegiatans', 'strategy_id')) {
                    try {
                        $table->dropForeign(['strategy_id']);
                    } catch (\Exception $e) {
                        // Foreign key may not exist
                    }
                    $table->foreign('strategy_id')
                        ->references('id')
                        ->on('strategies')
                        ->onDelete('cascade');
                }
                if (Schema::hasColumn('kegiatans', 'indikator_id')) {
                    try {
                        $table->dropForeign(['indikator_id']);
                    } catch (\Exception $e) {
                        // Foreign key may not exist
                    }
                    $table->foreign('indikator_id')
                        ->references('id')
                        ->on('indikators')
                        ->onDelete('cascade');
                }
                if (Schema::hasColumn('kegiatans', 'proker_id')) {
                    try {
                        $table->dropForeign(['proker_id']);
                    } catch (\Exception $e) {
                        // Foreign key may not exist
                    }
                    $table->foreign('proker_id')
                        ->references('id')
                        ->on('prokers')
                        ->onDelete('cascade');
                }
                // bagian_id was removed in a previous migration, skip it
            });
        }

        // Emails - add cascade delete on user
        if (Schema::hasTable('emails')) {
            Schema::table('emails', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }

        // Email_replys - add cascade delete
        if (Schema::hasTable('email_replys')) {
            Schema::table('email_replys', function (Blueprint $table) {
                $table->dropForeign(['email_id']);
                $table->dropForeign(['user_id']);

                $table->foreign('email_id')
                    ->references('id')
                    ->on('emails')
                    ->onDelete('cascade');
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }

        // Penerimaans - add cascade delete on unit
        if (Schema::hasTable('penerimaans')) {
            Schema::table('penerimaans', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->foreign('unit_id')
                    ->references('id')
                    ->on('units')
                    ->onDelete('cascade');
            });
        }

        // Realisasi_anggarans - add cascade delete on unit
        if (Schema::hasTable('realisasi_anggarans')) {
            Schema::table('realisasi_anggarans', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->foreign('unit_id')
                    ->references('id')
                    ->on('units')
                    ->onDelete('cascade');
            });
        }

        // Detail_pengajuans - add cascade delete
        if (Schema::hasTable('detail_pengajuans')) {
            Schema::table('detail_pengajuans', function (Blueprint $table) {
                $table->dropForeign(['pengajuan_anggaran_id']);

                $table->foreign('pengajuan_anggaran_id')
                    ->references('id')
                    ->on('pengajuan_anggarans')
                    ->onDelete('cascade');
            });
        }

        // LPJs - add cascade delete on pengajuan_anggaran
        if (Schema::hasTable('lpjs')) {
            Schema::table('lpjs', function (Blueprint $table) {
                $table->dropForeign(['pengajuan_anggaran_id']);
                $table->foreign('pengajuan_anggaran_id')
                    ->references('id')
                    ->on('pengajuan_anggarans')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip for SQLite
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        // Remove indexes if they exist
        $this->dropIndexIfExists('strategies', 'strategies_kode_index', ['kode']);
        $this->dropIndexIfExists('bagians', 'bagians_nama_index', ['nama']);
        $this->dropIndexIfExists('prokers', 'prokers_strategy_id_indikator_id_index', ['strategy_id', 'indikator_id']);
        $this->dropIndexIfExists('prokers', 'prokers_strategy_id_bagian_id_index', ['strategy_id', 'bagian_id']);
        $this->dropIndexIfExists('kegiatans', 'kegiatans_strategy_id_proker_id_index', ['strategy_id', 'proker_id']);
        $this->dropIndexIfExists('kegiatans', 'kegiatans_indikator_id_bagian_id_index', ['indikator_id', 'bagian_id']);
        $this->dropIndexIfExists('penerimaans', 'penerimaans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->dropIndexIfExists('realisasi_anggarans', 'realisasi_anggarans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->dropIndexIfExists('emails', 'emails_status_index', ['status']);
        $this->dropIndexIfExists('pengajuan_anggarans', 'pengajuan_anggarans_unit_id_tahun_index', ['unit_id', 'tahun']);
        $this->dropIndexIfExists('pengajuan_anggarans', 'pengajuan_anggarans_status_proses_index', ['status_proses']);
        $this->dropIndexIfExists('detail_pengajuans', 'detail_pengajuans_pengajuan_anggaran_id_mata_anggaran_id_index', ['pengajuan_anggaran_id', 'mata_anggaran_id']);
        $this->dropIndexIfExists('approvals', 'approvals_approvable_type_approvable_id_index', ['approvable_type', 'approvable_id']);
        $this->dropIndexIfExists('approvals', 'approvals_status_index', ['status']);
    }

    /**
     * Safely drop index if table and index exist.
     */
    private function dropIndexIfExists(string $table, string $indexName, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        if (! $this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($columns) {
            $tableBlueprint->dropIndex($columns);
        });
    }
};
