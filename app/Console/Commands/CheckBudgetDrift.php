<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\DetailMataAnggaran;
use Illuminate\Console\Command;

class CheckBudgetDrift extends Command
{
    protected $signature = 'budget:check-drift
        {--unit= : Filter berdasarkan unit_id}
        {--tahun= : Filter berdasarkan tahun ajaran (mis. 2026/2027)}
        {--fix : Selaraskan anggaran_awal & balance ke jumlah (hanya baris dengan saldo_dipakai = 0)}';

    protected $description = 'Deteksi detail_mata_anggaran yang anggaran_awal-nya tidak sinkron dengan jumlah (penyebab APBS != RAPBS).';

    public function handle(): int
    {
        $query = DetailMataAnggaran::query()
            ->with(['unit', 'mataAnggaran'])
            ->whereColumn('anggaran_awal', '<>', 'jumlah');

        if ($unitId = $this->option('unit')) {
            $query->where('unit_id', $unitId);
        }

        if ($tahun = $this->option('tahun')) {
            $query->where('tahun', $tahun);
        }

        $rows = $query->orderBy('unit_id')->get();

        if ($rows->isEmpty()) {
            $this->info('Tidak ditemukan drift anggaran_awal vs jumlah. APBS & RAPBS seharusnya sinkron.');

            return self::SUCCESS;
        }

        $this->warn("Ditemukan {$rows->count()} baris dengan anggaran_awal != jumlah:");
        $this->newLine();

        $this->table(
            ['ID', 'Unit', 'Kode', 'Nama', 'Jumlah (RAPBS)', 'Anggaran Awal (APBS)', 'Saldo Dipakai', 'Selisih'],
            $rows->map(fn (DetailMataAnggaran $row) => [
                $row->id,
                $row->unit?->nama ?? '-',
                $row->kode,
                str($row->nama)->limit(40),
                number_format((float) $row->jumlah, 0, ',', '.'),
                number_format((float) $row->anggaran_awal, 0, ',', '.'),
                number_format((float) $row->saldo_dipakai, 0, ',', '.'),
                number_format((float) $row->anggaran_awal - (float) $row->jumlah, 0, ',', '.'),
            ])->toArray(),
        );

        if (! $this->option('fix')) {
            $this->newLine();
            $this->comment('Jalankan ulang dengan --fix untuk menyelaraskan anggaran_awal & balance ke jumlah (hanya baris dengan saldo_dipakai = 0).');

            return self::FAILURE;
        }

        $fixed = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            if ((float) $row->saldo_dipakai !== 0.0) {
                $skipped++;
                $this->warn("  Lewati ID {$row->id} ({$row->kode}): saldo_dipakai != 0, tidak aman diselaraskan otomatis.");
                continue;
            }

            $row->update([
                'anggaran_awal' => $row->jumlah,
                'balance' => $row->jumlah,
            ]);
            $fixed++;
        }

        $this->newLine();
        $this->info("Selesai: {$fixed} baris diselaraskan, {$skipped} baris dilewati (perlu peninjauan manual).");

        return self::SUCCESS;
    }
}
