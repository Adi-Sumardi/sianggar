<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Backup seluruh database sebagai file .sql dan stream sebagai download.
     *
     * Implementasi murni PHP (tanpa mysqldump/shell_exec) agar tetap berjalan di
     * hosting yang menonaktifkan shell_exec. Hanya untuk role Administrator.
     */
    public function database(Request $request): StreamedResponse
    {
        abort_unless(
            $request->user()?->role === UserRole::Admin,
            403,
            'Hanya Administrator yang dapat mengakses backup database.',
        );

        $connection = DB::connection();

        abort_unless(
            $connection->getDriverName() === 'mysql',
            422,
            'Backup database hanya didukung untuk koneksi MySQL.',
        );

        $connection->disableQueryLog();
        @set_time_limit(0);

        $dbName = $connection->getDatabaseName();
        $filename = sprintf('backup-sianggar-%s.sql', now()->format('Ymd-His'));

        return response()->streamDownload(function () use ($connection, $dbName) {
            $out = fopen('php://output', 'w');
            $pdo = $connection->getPdo();

            $quote = static function ($value) use ($pdo): string {
                if ($value === null) {
                    return 'NULL';
                }
                if (is_int($value) || is_float($value)) {
                    return (string) $value;
                }

                return $pdo->quote((string) $value);
            };

            fwrite($out, "-- SIANGGAR database backup\n");
            fwrite($out, "-- Database : {$dbName}\n");
            fwrite($out, '-- Generated: '.now()->toDateTimeString()."\n\n");
            fwrite($out, "SET FOREIGN_KEY_CHECKS=0;\n");
            fwrite($out, "SET NAMES utf8mb4;\n");

            $tables = array_map(
                static fn ($row) => array_values((array) $row)[0],
                $connection->select('SHOW TABLES'),
            );

            foreach ($tables as $table) {
                $createRow = (array) $connection->selectOne("SHOW CREATE TABLE `{$table}`");

                // Lewati view (tidak ada 'Create Table'); backup hanya tabel data.
                if (! isset($createRow['Create Table'])) {
                    continue;
                }

                fwrite($out, "\n-- ----------------------------\n");
                fwrite($out, "-- Struktur tabel: {$table}\n");
                fwrite($out, "-- ----------------------------\n");
                fwrite($out, "DROP TABLE IF EXISTS `{$table}`;\n");
                fwrite($out, $createRow['Create Table'].";\n\n");

                $colList = null;
                $buffer = [];

                foreach ($connection->table($table)->cursor() as $row) {
                    $arr = (array) $row;

                    if ($colList === null) {
                        $colList = '`'.implode('`,`', array_keys($arr)).'`';
                    }

                    $buffer[] = '('.implode(',', array_map($quote, array_values($arr))).')';

                    if (count($buffer) >= 100) {
                        fwrite($out, "INSERT INTO `{$table}` ({$colList}) VALUES\n".implode(",\n", $buffer).";\n");
                        $buffer = [];
                    }
                }

                if (! empty($buffer)) {
                    fwrite($out, "INSERT INTO `{$table}` ({$colList}) VALUES\n".implode(",\n", $buffer).";\n");
                }
            }

            fwrite($out, "\nSET FOREIGN_KEY_CHECKS=1;\n");
            fclose($out);
        }, $filename, [
            'Content-Type' => 'application/sql',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Pulihkan database dari file backup .sql yang diunggah.
     *
     * OPERASI DESTRUKTIF: menjalankan seluruh isi file (DROP/CREATE/INSERT) ke
     * database aktif sehingga menimpa data yang ada. Murni PHP (PDO), tanpa
     * mysql CLI. Hanya untuk role Administrator.
     */
    public function restore(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()?->role === UserRole::Admin,
            403,
            'Hanya Administrator yang dapat memulihkan database.',
        );

        $request->validate([
            'file' => ['required', 'file', 'max:1048576'], // maks 1 GB (KB)
        ]);

        $connection = DB::connection();

        abort_unless(
            $connection->getDriverName() === 'mysql',
            422,
            'Restore database hanya didukung untuk koneksi MySQL.',
        );

        $file = $request->file('file');
        $ext = strtolower((string) $file->getClientOriginalExtension());

        abort_unless(
            in_array($ext, ['sql', 'txt'], true),
            422,
            'File harus berformat .sql',
        );

        $sql = file_get_contents($file->getRealPath());

        abort_if(
            $sql === false || trim($sql) === '',
            422,
            'File backup kosong atau tidak dapat dibaca.',
        );

        // Sanity check minimal agar tidak menjalankan file sembarangan.
        abort_unless(
            str_contains($sql, 'CREATE TABLE') || str_contains($sql, 'INSERT INTO'),
            422,
            'File tidak dikenali sebagai backup database SIANGGAR.',
        );

        $connection->disableQueryLog();
        @set_time_limit(0);

        try {
            // Bungkus dengan FK checks off agar urutan tabel tidak menggagalkan restore.
            $connection->unprepared("SET FOREIGN_KEY_CHECKS=0;\n".$sql."\nSET FOREIGN_KEY_CHECKS=1;");
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal memulihkan database: '.$e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Database berhasil dipulihkan dari backup.',
        ]);
    }
}
