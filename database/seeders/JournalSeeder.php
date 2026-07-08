<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Journal;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JournalSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $journals = [
            ['kode' => 'JU', 'nama' => 'Jurnal Umum', 'tipe' => 'umum'],
            ['kode' => 'JP', 'nama' => 'Jurnal Pengeluaran (LPJ)', 'tipe' => 'pengeluaran'],
            ['kode' => 'JR', 'nama' => 'Jurnal Penerimaan', 'tipe' => 'penerimaan'],
        ];

        foreach ($journals as $journal) {
            Journal::firstOrCreate(['kode' => $journal['kode']], $journal);
        }
    }
}
