<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\MataAnggaran;
use App\Models\Pkt;
use App\Models\Proker;
use App\Models\Rapbs;
use App\Models\RapbsItem;
use App\Models\Strategy;
use App\Models\SubMataAnggaran;
use App\Enums\UserRole;
use App\Models\Unit;
use App\Models\User;
use App\Services\PktService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed Spatie roles needed by User::booted() syncRoles()
    foreach (UserRole::cases() as $role) {
        Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
    }

    $this->pktService = app(PktService::class);
});

/**
 * Helper function to create the planning hierarchy.
 */
function createPlanningHierarchy(): array
{
    $strategy = Strategy::factory()->create();
    $indikator = Indikator::factory()->create(['strategy_id' => $strategy->id]);
    $proker = Proker::factory()->create([
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
    ]);
    $kegiatan = Kegiatan::factory()->create([
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
        'proker_id' => $proker->id,
    ]);

    return [
        'strategy_id' => $strategy->id,
        'indikator_id' => $indikator->id,
        'proker_id' => $proker->id,
        'kegiatan_id' => $kegiatan->id,
    ];
}

describe('PktService', function () {
    describe('create', function () {
        it('creates PKT with basic data', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $subMataAnggaran = SubMataAnggaran::factory()->create([
                'mata_anggaran_id' => $mataAnggaran->id,
            ]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'sub_mata_anggaran_id' => $subMataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Kegiatan Pembelajaran',
                'tujuan_kegiatan' => 'Meningkatkan kualitas',
                'saldo_anggaran' => 5000000,
                'volume' => 1,
                'satuan' => 'paket',
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            expect($pkt)->toBeInstanceOf(Pkt::class)
                ->and($pkt->deskripsi_kegiatan)->toBe('Kegiatan Pembelajaran')
                ->and((float) $pkt->saldo_anggaran)->toBe(5000000.0)
                ->and($pkt->status)->toBe('draft')
                ->and($pkt->created_by)->toBe($user->id);
        });

        it('auto-creates DetailMataAnggaran', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Test Kegiatan',
                'saldo_anggaran' => 10000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);
            $pkt->refresh();

            expect($pkt->detail_mata_anggaran_id)->not->toBeNull();

            $detail = DetailMataAnggaran::find($pkt->detail_mata_anggaran_id);
            expect($detail)->not->toBeNull()
                ->and((float) $detail->jumlah)->toBe(10000000.0)
                ->and((float) $detail->anggaran_awal)->toBe(10000000.0)
                ->and((float) $detail->balance)->toBe(10000000.0);
        });

        it('gets or creates RAPBS for unit/year', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->create(['unit_id' => $unit->id]);
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $unit->id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Test Kegiatan',
                'saldo_anggaran' => 5000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            $rapbs = Rapbs::where('unit_id', $unit->id)
                ->where('tahun', '2025')
                ->first();

            expect($rapbs)->not->toBeNull()
                ->and($rapbs->status->value)->toBe('draft');
        });

        it('creates RAPBS item from PKT', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Test Kegiatan',
                'saldo_anggaran' => 7500000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            $rapbsItem = RapbsItem::where('pkt_id', $pkt->id)->first();

            expect($rapbsItem)->not->toBeNull()
                ->and((float) $rapbsItem->jumlah)->toBe(7500000.0);
        });

        it('uses creator unit_id if not provided', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->create(['unit_id' => $unit->id]);
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $unit->id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Test Kegiatan',
                'saldo_anggaran' => 5000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            expect($pkt->unit_id)->toBe($unit->id);
        });
    });

    describe('update', function () {
        it('updates PKT data', function () {
            $user = User::factory()->unit()->create();
            $pkt = Pkt::factory()->draft()->createdBy($user)->create();

            $updatedPkt = $this->pktService->update($pkt, [
                'deskripsi_kegiatan' => 'Updated Kegiatan',
                'saldo_anggaran' => 15000000,
            ], $user);

            expect($updatedPkt->deskripsi_kegiatan)->toBe('Updated Kegiatan')
                ->and((float) $updatedPkt->saldo_anggaran)->toBe(15000000.0);
        });

        it('updates related DetailMataAnggaran', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Original Kegiatan',
                'saldo_anggaran' => 5000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            $this->pktService->update($pkt, [
                'saldo_anggaran' => 8000000,
            ], $user);

            $detail = DetailMataAnggaran::find($pkt->detail_mata_anggaran_id);
            expect((float) $detail->jumlah)->toBe(8000000.0)
                ->and((float) $detail->anggaran_awal)->toBe(8000000.0);
        });

        it('updates related RAPBS item', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Original Kegiatan',
                'saldo_anggaran' => 5000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);

            $this->pktService->update($pkt, [
                'saldo_anggaran' => 12000000,
            ], $user);

            $rapbsItem = RapbsItem::where('pkt_id', $pkt->id)->first();
            expect((float) $rapbsItem->jumlah)->toBe(12000000.0);
        });
    });

    describe('delete', function () {
        it('deletes PKT and related records', function () {
            $user = User::factory()->unit()->create();
            $mataAnggaran = MataAnggaran::factory()->create(['unit_id' => $user->unit_id]);
            $hierarchy = createPlanningHierarchy();

            $data = [
                'mata_anggaran_id' => $mataAnggaran->id,
                'tahun' => '2025',
                'unit' => 'SD',
                'deskripsi_kegiatan' => 'Test Kegiatan',
                'saldo_anggaran' => 5000000,
                ...$hierarchy,
            ];

            $pkt = $this->pktService->create($data, $user);
            $pktId = $pkt->id;
            $detailId = $pkt->detail_mata_anggaran_id;

            $result = $this->pktService->delete($pkt, $user);

            expect($result)->toBeTrue()
                ->and(Pkt::find($pktId))->toBeNull()
                ->and(DetailMataAnggaran::find($detailId))->toBeNull()
                ->and(RapbsItem::where('pkt_id', $pktId)->first())->toBeNull();
        });
    });

    describe('submit', function () {
        it('changes PKT status to submitted', function () {
            $user = User::factory()->unit()->create();
            $pkt = Pkt::factory()->draft()->createdBy($user)->create();

            $submittedPkt = $this->pktService->submit($pkt, $user);

            expect($submittedPkt->status)->toBe('submitted');
        });
    });

    describe('getForUser', function () {
        beforeEach(function () {
            $this->unit1 = Unit::factory()->create();
            $this->unit2 = Unit::factory()->create();

            Pkt::factory()->count(3)->create([
                'unit_id' => $this->unit1->id,
                'tahun' => '2025',
            ]);

            Pkt::factory()->count(2)->create([
                'unit_id' => $this->unit2->id,
                'tahun' => '2025',
            ]);

            Pkt::factory()->count(2)->create([
                'unit_id' => $this->unit1->id,
                'tahun' => '2024',
            ]);
        });

        it('returns PKT list for unit user filtered by their unit', function () {
            $user = User::factory()->unit()->create(['unit_id' => $this->unit1->id]);

            $pkts = $this->pktService->getForUser($user);

            expect($pkts)->toHaveCount(5);
            $pkts->each(function ($pkt) {
                expect($pkt->unit_id)->toBe($this->unit1->id);
            });
        });

        it('filters by year', function () {
            $user = User::factory()->unit()->create(['unit_id' => $this->unit1->id]);

            $pkts = $this->pktService->getForUser($user, ['tahun' => '2025']);

            expect($pkts)->toHaveCount(3);
        });

        it('filters by unit_id', function () {
            $user = User::factory()->admin()->create();

            $pkts = $this->pktService->getForUser($user, ['unit_id' => $this->unit2->id]);

            expect($pkts)->toHaveCount(2);
        });

        it('filters by status', function () {
            $user = User::factory()->admin()->create();
            Pkt::factory()->submitted()->create([
                'unit_id' => $this->unit1->id,
                'tahun' => '2025',
            ]);

            $pkts = $this->pktService->getForUser($user, ['status' => 'submitted']);

            expect($pkts)->toHaveCount(1);
        });

        it('searches by deskripsi_kegiatan', function () {
            $user = User::factory()->admin()->create();
            Pkt::factory()->create([
                'deskripsi_kegiatan' => 'Pembelajaran Khusus',
            ]);

            $pkts = $this->pktService->getForUser($user, ['search' => 'Khusus']);

            expect($pkts)->toHaveCount(1);
        });
    });
});
