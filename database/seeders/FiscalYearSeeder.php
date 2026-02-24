<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\FiscalYear;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FiscalYearSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        FiscalYear::updateOrCreate(
            ['tahun' => '2025/2026'],
            [
                'tahun' => '2025/2026',
                'is_active' => true,
                'start_date' => '2025-07-01',
                'end_date' => '2026-06-30',
            ],
        );
    }
}
