<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ---------------------------------------------------------------------
        // Create permissions
        // ---------------------------------------------------------------------
        $permissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget',
            'create-proposal',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'create-lpj',
            'manage-reports',
            'view-planning',
            'manage-planning',
            'view-emails',
            'manage-emails',
            'manage-users',
            'manage-units',
            'manage-perubahan',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ---------------------------------------------------------------------
        // Define permission groups for role categories
        // ---------------------------------------------------------------------
        $allPermissions = $permissions;

        $unitPermissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget', // Unit bisa create COA (Mata Anggaran)
            'create-proposal',
            'view-proposals',
            'view-reports',
            'create-lpj',
            'view-emails',
            'manage-emails',
            'manage-perubahan',
            'view-planning',
            'manage-planning', // Unit bisa create Proker, Kegiatan, PKT
        ];

        $financePermissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'manage-reports',
            'view-emails',
        ];

        $leadershipPermissions = [
            'view-dashboard',
            'view-budget',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'view-emails',
        ];

        $approverPermissions = [
            'view-dashboard',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'view-emails',
        ];

        $kabagPermissions = [
            'view-dashboard',
            'view-budget',
            'create-proposal',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'view-emails',
        ];

        $substansiPermissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget', // Substansi bisa create COA (Mata Anggaran)
            'create-proposal',
            'view-proposals',
            'view-reports',
            'create-lpj',
            'view-emails',
            'manage-emails',
            'view-planning',
            'manage-planning', // Substansi bisa create Proker, Kegiatan, PKT
            'manage-perubahan', // Substansi bisa create Perubahan Anggaran
        ];

        $otherPermissions = [
            'view-dashboard',
            'view-budget',
            'view-proposals',
            'view-reports',
            'view-emails',
        ];

        // ---------------------------------------------------------------------
        // Map each UserRole to its permission set
        // ---------------------------------------------------------------------
        $rolePermissionMap = [
            // Admin
            UserRole::Admin->value => $allPermissions,

            // Leadership
            UserRole::Direktur->value => $leadershipPermissions,
            UserRole::Ketua1->value => $leadershipPermissions,
            UserRole::Ketum->value => $leadershipPermissions,

            // Finance
            UserRole::Keuangan->value => $financePermissions,
            UserRole::StaffKeuangan->value => $financePermissions,
            UserRole::Bendahara->value => $financePermissions,
            UserRole::Akuntansi->value => $financePermissions,
            UserRole::Kasir->value => $financePermissions,
            UserRole::Payment->value => $financePermissions,

            // KabagSdmUmum (special)
            UserRole::KabagSdmUmum->value => $kabagPermissions,

            // Approvers
            UserRole::Sekretariat->value => $approverPermissions,
            UserRole::Sekretaris->value => $approverPermissions,
            UserRole::StaffDirektur->value => array_unique(array_merge($approverPermissions, ['create-proposal'])),

            // Unit roles
            UserRole::PG->value => $unitPermissions,
            UserRole::RA->value => $unitPermissions,
            UserRole::TK->value => $unitPermissions,
            UserRole::SD->value => $unitPermissions,
            UserRole::SMP12->value => $unitPermissions,
            UserRole::SMP55->value => $unitPermissions,
            UserRole::SMA33->value => $unitPermissions,
            UserRole::Stebank->value => $unitPermissions,

            // Substansi roles
            UserRole::Asrama->value => $substansiPermissions,
            UserRole::Laz->value => $substansiPermissions,
            UserRole::Litbang->value => $substansiPermissions,
            UserRole::SDM->value => $substansiPermissions,
            UserRole::Umum->value => $substansiPermissions,
            UserRole::StaffSekretariat->value => $substansiPermissions,

            // Other
            UserRole::Ketua->value => $otherPermissions,
            UserRole::Unit->value => $otherPermissions,
            UserRole::Pembangunan->value => $otherPermissions,
        ];

        // ---------------------------------------------------------------------
        // Create roles and assign permissions
        // ---------------------------------------------------------------------
        foreach ($rolePermissionMap as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}
