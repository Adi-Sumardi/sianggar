<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\PerubahanAnggaranStatus;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\PerubahanAnggaranItem;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-proposals', 'guard_name' => 'web']);
    Permission::create(['name' => 'create-proposal', 'guard_name' => 'web']);
    Permission::create(['name' => 'approve-proposals', 'guard_name' => 'web']);
});

describe('Perubahan Anggaran API', function () {
    describe('GET /api/v1/perubahan-anggaran', function () {
        it('returns list of perubahan anggaran for admin', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            PerubahanAnggaran::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/perubahan-anggaran');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_perubahan',
                            'perihal',
                            'status',
                            'total_amount',
                        ],
                    ],
                ]);
        });

        it('filters by user for unit user', function () {
            $unit = Unit::factory()->create();
            $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $unitUser->givePermissionTo('view-proposals');

            // Create perubahan for this user
            PerubahanAnggaran::factory()->count(3)->forUser($unitUser)->create();
            // Create perubahan for other users
            PerubahanAnggaran::factory()->count(5)->create();

            $response = $this->actingAs($unitUser)
                ->getJson('/api/v1/perubahan-anggaran');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(3);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/perubahan-anggaran');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/perubahan-anggaran');

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/perubahan-anggaran/{id}', function () {
        it('returns perubahan anggaran details', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            $perubahan = PerubahanAnggaran::factory()->create();

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/perubahan-anggaran/{$perubahan->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'nomor_perubahan',
                        'perihal',
                        'alasan',
                        'status',
                        'total_amount',
                    ],
                ])
                ->assertJsonPath('data.id', $perubahan->id);
        });

        it('returns 404 for non-existent perubahan', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/perubahan-anggaran/999999');

            $response->assertNotFound();
        });
    });

    describe('POST /api/v1/perubahan-anggaran (Geser Anggaran)', function () {
        it('creates perubahan anggaran with geser type', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $source = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(10000000)->create();
            $target = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(5000000)->create();

            $data = [
                'tahun' => (string) date('Y'),
                'perihal' => 'Pergeseran anggaran operasional',
                'alasan' => 'Kebutuhan mendesak untuk operasional',
                'items' => [
                    [
                        'type' => 'geser',
                        'source_detail_mata_anggaran_id' => $source->id,
                        'target_detail_mata_anggaran_id' => $target->id,
                        'amount' => 2000000,
                        'keterangan' => 'Geser dari source ke target',
                    ],
                ],
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/perubahan-anggaran', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'id',
                        'nomor_perubahan',
                        'perihal',
                        'status',
                    ],
                ]);

            expect(PerubahanAnggaran::count())->toBe(1);
            expect(PerubahanAnggaranItem::count())->toBe(1);
        });

        it('validates required fields', function () {
            $user = User::factory()->unit()->create();
            $user->givePermissionTo('create-proposal');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/perubahan-anggaran', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['tahun', 'perihal', 'alasan', 'items']);
        });
    });

    describe('POST /api/v1/perubahan-anggaran (Tambah Anggaran)', function () {
        it('creates perubahan anggaran with tambah type', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $target = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(5000000)->create();

            $data = [
                'tahun' => (string) date('Y'),
                'perihal' => 'Penambahan anggaran kegiatan',
                'alasan' => 'Kegiatan baru yang tidak dianggarkan sebelumnya',
                'items' => [
                    [
                        'type' => 'tambah',
                        'target_detail_mata_anggaran_id' => $target->id,
                        'amount' => 3000000,
                        'keterangan' => 'Tambah anggaran kegiatan baru',
                    ],
                ],
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/perubahan-anggaran', $data);

            $response->assertCreated();

            $item = PerubahanAnggaranItem::first();
            expect($item->type)->toBe('tambah');
            expect($item->source_detail_mata_anggaran_id)->toBeNull();
        });
    });

    describe('PUT /api/v1/perubahan-anggaran/{id}', function () {
        it('updates draft perubahan anggaran', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()->draft()->forUser($user)->create();

            $response = $this->actingAs($user)
                ->putJson("/api/v1/perubahan-anggaran/{$perubahan->id}", [
                    'perihal' => 'Updated perihal',
                    'alasan' => 'Updated alasan',
                ]);

            $response->assertOk()
                ->assertJsonPath('data.perihal', 'Updated perihal');
        });

        it('cannot update submitted perubahan', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            $response = $this->actingAs($admin)
                ->putJson("/api/v1/perubahan-anggaran/{$perubahan->id}", [
                    'perihal' => 'Should not update',
                ]);

            $response->assertUnprocessable();
        });

        it('can update revision required perubahan', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()
                ->revisionRequired()
                ->forUser($user)
                ->create();

            $response = $this->actingAs($user)
                ->putJson("/api/v1/perubahan-anggaran/{$perubahan->id}", [
                    'perihal' => 'Revised perihal',
                ]);

            $response->assertOk()
                ->assertJsonPath('data.perihal', 'Revised perihal');
        });
    });

    describe('DELETE /api/v1/perubahan-anggaran/{id}', function () {
        it('deletes draft perubahan anggaran', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()->draft()->forUser($user)->create();

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/perubahan-anggaran/{$perubahan->id}");

            $response->assertOk();
            expect(PerubahanAnggaran::find($perubahan->id))->toBeNull();
        });

        it('cannot delete submitted perubahan', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            $response = $this->actingAs($admin)
                ->deleteJson("/api/v1/perubahan-anggaran/{$perubahan->id}");

            $response->assertUnprocessable();
        });
    });

    describe('POST /api/v1/perubahan-anggaran/{id}/submit', function () {
        it('submits draft perubahan for approval', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $source = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(10000000)->create();
            $target = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(5000000)->create();

            $perubahan = PerubahanAnggaran::factory()->draft()->forUser($user)->create();
            PerubahanAnggaranItem::factory()
                ->forPerubahanAnggaran($perubahan)
                ->geser()
                ->fromSource($source)
                ->toTarget($target)
                ->withAmount(2000000)
                ->create();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/submit");

            $response->assertOk()
                ->assertJsonPath('data.status', PerubahanAnggaranStatus::Submitted->value);

            $perubahan->refresh();
            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Submitted);
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::Direktur);
        });

        it('cannot submit without items', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $perubahan = PerubahanAnggaran::factory()->draft()->forUser($user)->create();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/submit");

            $response->assertUnprocessable();
        });

        it('cannot submit if source budget insufficient', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->unit()->create(['unit_id' => $unit->id]);
            $user->givePermissionTo('create-proposal');

            $source = DetailMataAnggaran::factory()->forUnit($unit)->withBudget(1000000)->create();
            $target = DetailMataAnggaran::factory()->forUnit($unit)->create();

            $perubahan = PerubahanAnggaran::factory()->draft()->forUser($user)->create();
            PerubahanAnggaranItem::factory()
                ->forPerubahanAnggaran($perubahan)
                ->geser()
                ->fromSource($source)
                ->toTarget($target)
                ->withAmount(5000000) // More than source balance
                ->create();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/submit");

            $response->assertUnprocessable();
        });
    });
});

describe('Perubahan Anggaran Approval Workflow', function () {
    describe('POST /api/v1/perubahan-anggaran/{id}/approve', function () {
        it('approves perubahan as direktur', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            // Create pending approval at Direktur stage
            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/approve", [
                    'notes' => 'Disetujui',
                ]);

            $response->assertOk();

            $perubahan->refresh();
            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::ApprovedLevel1);
            expect($perubahan->current_approval_stage)->toBe(ApprovalStage::WakilKetua);
        });

        it('returns 403 if user cannot approve stage', function () {
            // Unit user cannot approve Direktur stage
            $unitUser = User::factory()->unit()->create();
            $unitUser->givePermissionTo('approve-proposals');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($unitUser)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/approve");

            $response->assertUnprocessable();
        });
    });

    describe('POST /api/v1/perubahan-anggaran/{id}/revise', function () {
        it('sends perubahan back for revision', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/revise", [
                    'notes' => 'Perlu perbaikan dokumen',
                ]);

            $response->assertOk();

            $perubahan->refresh();
            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::RevisionRequired);
        });

        it('requires notes for revision', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/perubahan-anggaran/{id}/reject', function () {
        it('rejects perubahan permanently', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $perubahan = PerubahanAnggaran::factory()->submitted()->create();

            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/perubahan-anggaran/{$perubahan->id}/reject", [
                    'notes' => 'Tidak sesuai kebijakan',
                ]);

            $response->assertOk();

            $perubahan->refresh();
            expect($perubahan->status)->toBe(PerubahanAnggaranStatus::Rejected);
            expect($perubahan->isFinal())->toBeTrue();
        });
    });

    describe('GET /api/v1/perubahan-anggaran-queue', function () {
        it('returns pending perubahan for direktur', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            // Create perubahan at Direktur stage
            $perubahan = PerubahanAnggaran::factory()->submitted()->create();
            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            // Create perubahan at different stage
            $otherPerubahan = PerubahanAnggaran::factory()->approvedLevel1()->create();
            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $otherPerubahan->id,
                'stage' => ApprovalStage::WakilKetua->value,
                'stage_order' => 2,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($direktur)
                ->getJson('/api/v1/perubahan-anggaran-queue');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(1);
        });
    });
});

describe('Perubahan Anggaran Expected Stages', function () {
    it('returns expected stages for unit submitter', function () {
        $admin = User::factory()->admin()->create();
        $admin->givePermissionTo('view-proposals');

        $perubahan = PerubahanAnggaran::factory()->submitted()->unitSubmitter()->create();

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/perubahan-anggaran/{$perubahan->id}/expected-stages");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'stage',
                        'label',
                        'status',
                        'order',
                    ],
                ],
            ]);

        $stages = $response->json('data');
        expect(count($stages))->toBe(5); // Direktur, WakilKetua, Ketum, Keuangan, Bendahara
        expect($stages[0]['stage'])->toBe(ApprovalStage::Direktur->value);
    });

    it('returns expected stages for substansi submitter', function () {
        $admin = User::factory()->admin()->create();
        $admin->givePermissionTo('view-proposals');

        $perubahan = PerubahanAnggaran::factory()->submittedSubstansi()->create();

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/perubahan-anggaran/{$perubahan->id}/expected-stages");

        $response->assertOk();

        $stages = $response->json('data');
        expect(count($stages))->toBe(5); // KabagSekretariat, Sekretaris, Ketum, Keuangan, Bendahara
        expect($stages[0]['stage'])->toBe(ApprovalStage::KabagSekretariat->value);
    });
});
