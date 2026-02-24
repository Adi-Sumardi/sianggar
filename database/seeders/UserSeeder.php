<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        // ---------------------------------------------------------------
        // Admin
        // ---------------------------------------------------------------
        $this->createUser('Administrator', 'admin@sianggar.test', UserRole::Admin, $password);

        // ---------------------------------------------------------------
        // Leadership (Pimpinan)
        // ---------------------------------------------------------------
        $this->createUser('Direktur Pendidikan', 'direktur@sianggar.test', UserRole::Direktur, $password);
        $this->createUser('Ketua Umum', 'ketum@sianggar.test', UserRole::Ketum, $password);
        $this->createUser('Wakil Ketua', 'ketua1@sianggar.test', UserRole::Ketua1, $password);
        $this->createUser('Sekretaris', 'sekretaris@sianggar.test', UserRole::Sekretaris, $password);

        // ---------------------------------------------------------------
        // Finance (Keuangan)
        // ---------------------------------------------------------------
        $this->createUser('Keuangan', 'keuangan@sianggar.test', UserRole::Keuangan, $password);
        $this->createUser('Staf Keuangan', 'staff.keuangan@sianggar.test', UserRole::StaffKeuangan, $password);
        $this->createUser('Bendahara', 'bendahara@sianggar.test', UserRole::Bendahara, $password);
        $this->createUser('Kasir', 'kasir@sianggar.test', UserRole::Kasir, $password);
        $this->createUser('Akuntansi', 'akuntansi@sianggar.test', UserRole::Akuntansi, $password);

        // ---------------------------------------------------------------
        // Approvers (Staff)
        // ---------------------------------------------------------------
        $this->createUser('Staf Direktur', 'staff.direktur@sianggar.test', UserRole::StaffDirektur, $password);
        $this->createUser('Kabag Sekretariat', 'sekretariat@sianggar.test', UserRole::Sekretariat, $password);
        $this->createUser('Kabag SDM & Umum', 'kabag@sianggar.test', UserRole::KabagSdmUmum, $password);

        // ---------------------------------------------------------------
        // Substansi (can create proposals, NOT approvers)
        // ---------------------------------------------------------------
        $this->createUser('Asrama', 'asrama@sianggar.test', UserRole::Asrama, $password);
        $this->createUser('LAZ', 'laz@sianggar.test', UserRole::Laz, $password);
        $this->createUser('Litbang', 'litbang@sianggar.test', UserRole::Litbang, $password);
        $this->createUser('SDM', 'sdm@sianggar.test', UserRole::SDM, $password);
        $this->createUser('Umum', 'umum@sianggar.test', UserRole::Umum, $password);
        $this->createUser('Staf Sekretariat', 'staff.sekretariat@sianggar.test', UserRole::StaffSekretariat, $password);

        // ---------------------------------------------------------------
        // Unit users (each linked to their respective unit)
        // ---------------------------------------------------------------
        $unitUsers = [
            ['name' => 'User PG', 'email' => 'pg@sianggar.test', 'role' => UserRole::PG, 'unit_kode' => 'PG'],
            ['name' => 'User RA', 'email' => 'ra@sianggar.test', 'role' => UserRole::RA, 'unit_kode' => 'RA'],
            ['name' => 'User TK', 'email' => 'tk@sianggar.test', 'role' => UserRole::TK, 'unit_kode' => 'TK'],
            ['name' => 'User SD', 'email' => 'sd@sianggar.test', 'role' => UserRole::SD, 'unit_kode' => 'SD'],
            ['name' => 'User SMP 1-2', 'email' => 'smp12@sianggar.test', 'role' => UserRole::SMP12, 'unit_kode' => 'SMP12'],
            ['name' => 'User SMP 5-5', 'email' => 'smp55@sianggar.test', 'role' => UserRole::SMP55, 'unit_kode' => 'SMP55'],
            ['name' => 'User SMA 3-3', 'email' => 'sma33@sianggar.test', 'role' => UserRole::SMA33, 'unit_kode' => 'SMA33'],
            ['name' => 'User STEBANK', 'email' => 'stebank@sianggar.test', 'role' => UserRole::Stebank, 'unit_kode' => 'Stebank'],
        ];

        foreach ($unitUsers as $userData) {
            $unit = Unit::where('kode', $userData['unit_kode'])->first();

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => $password,
                    'role' => $userData['role'],
                    'unit_id' => $unit?->id,
                ],
            );
            $user->syncRoles($userData['role']->value);
        }
    }

    /**
     * Helper to create a non-unit user.
     */
    private function createUser(string $name, string $email, UserRole $role, string $password): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'role' => $role,
                'unit_id' => null,
            ],
        );
        $user->syncRoles($role->value);

        return $user;
    }
}
