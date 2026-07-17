<?php

declare(strict_types=1);

use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);
});

describe('GET /api/v1/laporan/cawu-unit', function () {
    it('counts paid pengajuan in total_pengajuan', function () {
        // Regresi: filter lama status_proses = 'approved' tidak pernah match
        // (nilai itu tidak ada di enum ProposalStatus), jadi total_pengajuan
        // selalu 0 termasuk untuk pengajuan yang sudah paid.
        $user = User::factory()->admin()->create();
        $user->givePermissionTo('view-reports');

        $unit = Unit::factory()->create();
        PengajuanAnggaran::factory()->create([
            'unit_id' => $unit->id,
            'tahun' => '2026/2027',
            'status_proses' => 'paid',
            'jumlah_pengajuan_total' => 3_000_000,
        ]);
        PengajuanAnggaran::factory()->create([
            'unit_id' => $unit->id,
            'tahun' => '2026/2027',
            'status_proses' => 'draft',
            'jumlah_pengajuan_total' => 999_999,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/laporan/cawu-unit?unit_id={$unit->id}&tahun=2026/2027");

        $response->assertOk()
            ->assertJsonPath('data.total_pengajuan', 3000000)
            ->assertJsonPath('data.pengajuans_count', 1);
    });
});

describe('GET /api/v1/laporan/cawu-gabungan', function () {
    it('counts paid pengajuan across units', function () {
        $user = User::factory()->admin()->create();
        $user->givePermissionTo('view-reports');

        $unit = Unit::factory()->create();
        PengajuanAnggaran::factory()->create([
            'unit_id' => $unit->id,
            'tahun' => '2026/2027',
            'status_proses' => 'paid',
            'jumlah_pengajuan_total' => 1_500_000,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/laporan/cawu-gabungan?unit_id={$unit->id}&tahun=2026/2027");

        $response->assertOk();
        $units = collect($response->json('data.units'));
        expect($units->firstWhere('unit_id', $unit->id)['total_pengajuan'])->toBe(1500000);
    });
});
