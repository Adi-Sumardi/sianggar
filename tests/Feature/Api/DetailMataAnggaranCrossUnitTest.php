<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use App\Models\Unit;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::create(['name' => 'view-budget', 'guard_name' => 'web']);
});

describe('GET /api/v1/detail-mata-anggarans - kasus khusus PT YAPI Talent Academy', function () {
    it('includes Bagian Umum "Tambahan Modal YTA" item (kode 695-11-17) when filtering by PT YAPI Talent Academy unit_id', function () {
        $bagianUmum = Unit::factory()->create(['nama' => 'Bagian Umum']);
        $yta = Unit::factory()->create(['nama' => 'PT YAPI Talent Academy']);

        $sharedItem = DetailMataAnggaran::factory()->forUnit($bagianUmum)->create([
            'kode' => '695-11-17',
            'nama' => 'Tambahan Modal YTA',
        ]);

        $unrelatedBagianUmumItem = DetailMataAnggaran::factory()->forUnit($bagianUmum)->create([
            'kode' => '695-11-99',
            'nama' => 'Item Bagian Umum lain',
        ]);

        $user = User::factory()->unit()->create(['unit_id' => $yta->id]);
        $user->givePermissionTo('view-budget');

        $response = $this->actingAs($user)
            ->getJson("/api/v1/detail-mata-anggarans?unit_id={$yta->id}");

        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id');

        expect($ids)->toContain($sharedItem->id);
        expect($ids)->not->toContain($unrelatedBagianUmumItem->id);
    });

    it('does not leak the shared item into other units', function () {
        $bagianUmum = Unit::factory()->create(['nama' => 'Bagian Umum']);
        $otherUnit = Unit::factory()->create(['nama' => 'Unit Lain']);

        $sharedItem = DetailMataAnggaran::factory()->forUnit($bagianUmum)->create([
            'kode' => '695-11-17',
            'nama' => 'Tambahan Modal YTA',
        ]);

        $user = User::factory()->unit()->create(['unit_id' => $otherUnit->id]);
        $user->givePermissionTo('view-budget');

        $response = $this->actingAs($user)
            ->getJson("/api/v1/detail-mata-anggarans?unit_id={$otherUnit->id}");

        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id');

        expect($ids)->not->toContain($sharedItem->id);
    });
});
