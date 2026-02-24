<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * The order matters: units must exist before users (for unit_id FK),
     * and units must exist before mata anggaran records.
     */
    public function run(): void
    {
        $this->call([
            FiscalYearSeeder::class,
            UnitSeeder::class,
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
            StrategySeeder::class,
            MataAnggaranSeeder::class,
            PengajuanSeeder::class,
        ]);
    }
}
