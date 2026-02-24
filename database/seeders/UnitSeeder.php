<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            ['kode' => 'PG', 'nama' => 'Playgroup'],
            ['kode' => 'RA', 'nama' => 'Raudhatul Athfal'],
            ['kode' => 'TK', 'nama' => 'Taman Kanak-Kanak'],
            ['kode' => 'SD', 'nama' => 'Sekolah Dasar'],
            ['kode' => 'SMP12', 'nama' => 'SMP 1-2'],
            ['kode' => 'SMP55', 'nama' => 'SMP 5-5'],
            ['kode' => 'SMA33', 'nama' => 'SMA 3-3'],
            ['kode' => 'Stebank', 'nama' => 'STEBANK'],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                ['kode' => $unit['kode']],
                $unit,
            );
        }
    }
}
