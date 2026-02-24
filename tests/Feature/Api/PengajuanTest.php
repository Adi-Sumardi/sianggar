<?php

declare(strict_types=1);

use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Enums\UserRole;
use App\Models\DetailMataAnggaran;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();

    // Create necessary permissions
    Permission::create(['name' => 'view-proposals', 'guard_name' => 'web']);
    Permission::create(['name' => 'create-proposal', 'guard_name' => 'web']);
    Permission::create(['name' => 'approve-proposals', 'guard_name' => 'web']);
    Permission::create(['name' => 'view-dashboard', 'guard_name' => 'web']);
});

describe('Pengajuan API', function () {
    describe('GET /api/v1/pengajuan', function () {
        it('returns paginated list of pengajuan for admin', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            PengajuanAnggaran::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pengajuan');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_pengajuan',
                            'perihal',
                            'status_proses',
                            'jumlah_pengajuan_total',
                        ],
                    ],
                    'meta' => ['current_page', 'total'],
                ]);
        });

        it('filters by status', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            PengajuanAnggaran::factory()->draft()->count(3)->create();
            PengajuanAnggaran::factory()->submitted()->count(2)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pengajuan?status=draft');

            $response->assertOk();
            expect($response->json('meta.total'))->toBe(3);
        });

        it('filters by year', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-proposals');

            PengajuanAnggaran::factory()->create(['tahun' => 2024]);
            PengajuanAnggaran::factory()->create(['tahun' => 2024]);
            PengajuanAnggaran::factory()->create(['tahun' => 2025]);

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/pengajuan?tahun=2024');

            $response->assertOk();
            expect($response->json('meta.total'))->toBe(2);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/pengajuan');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/pengajuan');

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pengajuan', function () {
        it('creates a new pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $detailMataAnggaran = DetailMataAnggaran::factory()->create();

            $data = [
                'no_surat' => 'NSR/2025/001',
                'nama_pengajuan' => 'Test Event',
                'tahun' => '2025',
                'tempat' => 'Jakarta',
                'waktu_kegiatan' => '2025-06-15',
                'details' => [
                    [
                        'detail_mata_anggaran_id' => $detailMataAnggaran->id,
                        'mata_anggaran_id' => $detailMataAnggaran->mata_anggaran_id,
                        'sub_mata_anggaran_id' => $detailMataAnggaran->sub_mata_anggaran_id,
                        'jumlah' => 5000000,
                    ],
                ],
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pengajuan', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'nomor_pengajuan',
                        'nama_pengajuan',
                        'status_proses',
                    ],
                ])
                ->assertJsonPath('data.nama_pengajuan', 'Test Event')
                ->assertJsonPath('data.status_proses', ProposalStatus::Draft->value);
        });

        it('validates required fields', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pengajuan', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['no_surat', 'nama_pengajuan', 'tahun', 'details']);
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->postJson('/api/v1/pengajuan', [
                    'perihal' => 'Test',
                    'jumlah_pengajuan_total' => 1000000,
                ]);

            $response->assertForbidden();
        });
    });

    describe('GET /api/v1/pengajuan/{id}', function () {
        it('returns pengajuan details', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();

            $response = $this->actingAs($user)
                ->getJson("/api/v1/pengajuan/{$pengajuan->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'nomor_pengajuan',
                        'perihal',
                        'status_proses',
                        'user',
                        'approvals',
                    ],
                ])
                ->assertJsonPath('data.id', $pengajuan->id);
        });

        it('returns 404 for non-existent pengajuan', function () {
            $user = User::factory()->admin()->create();
            $user->givePermissionTo('view-proposals');

            $response = $this->actingAs($user)
                ->getJson('/api/v1/pengajuan/999999');

            $response->assertNotFound();
        });
    });

    describe('PUT /api/v1/pengajuan/{id}', function () {
        it('updates a draft pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->draft()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/pengajuan/{$pengajuan->id}", [
                    'nama_pengajuan' => 'Updated Pengajuan',
                ]);

            $response->assertOk()
                ->assertJsonPath('data.nama_pengajuan', 'Updated Pengajuan');
        });

        it('cannot update non-draft pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/pengajuan/{$pengajuan->id}", [
                    'nama_pengajuan' => 'Updated Pengajuan',
                ]);

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pengajuan/{id}/submit', function () {
        it('submits a draft pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->draft()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/submit");

            $response->assertOk()
                ->assertJsonPath('data.status_proses', ProposalStatus::Submitted->value);
        });

        it('cannot submit already submitted pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/submit");

            // Returns 403 because policy blocks non-draft submit
            $response->assertForbidden();
        });
    });

    describe('DELETE /api/v1/pengajuan/{id}', function () {
        it('deletes a draft pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->draft()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/pengajuan/{$pengajuan->id}");

            $response->assertNoContent();

            expect(PengajuanAnggaran::find($pengajuan->id))->toBeNull();
        });

        it('cannot delete non-draft pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-proposal');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'user_id' => $user->id,
            ]);

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/pengajuan/{$pengajuan->id}");

            $response->assertForbidden();
        });
    });
});

describe('Approval API', function () {
    describe('GET /api/v1/approval-queue', function () {
        it('returns pending approvals for approver', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            // Create submitted pengajuan
            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);

            // Submit it through the service
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($staffDirektur)
                ->getJson('/api/v1/approval-queue');

            // Returns PengajuanResource collection (not Approval objects)
            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_pengajuan',
                            'status_proses',
                        ],
                    ],
                ]);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/approve', function () {
        it('approves pengajuan at current stage', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/approve", [
                    'notes' => 'Approved',
                ]);

            $response->assertOk();

            $pengajuan->refresh();
            expect($pengajuan->current_approval_stage)->toBe('staff-keuangan');
        });

        it('returns error when not authorized', function () {
            $unitUser = User::factory()->unit()->create();
            $kasir = User::factory()->kasir()->create();
            $kasir->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($kasir)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/approve");

            // Returns 403 because policy blocks unauthorized approvers
            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pengajuan/{id}/revise', function () {
        it('requests revision with notes', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/revise", [
                    'notes' => 'Please fix the budget calculation',
                ]);

            $response->assertOk();

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::RevisionRequired);
        });

        it('requires notes for revision', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/reject', function () {
        it('rejects pengajuan with notes', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/reject", [
                    'notes' => 'Rejected due to policy violation',
                ]);

            $response->assertOk();

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::Rejected);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/validate', function () {
        it('validates pengajuan at StaffKeuangan stage', function () {
            $unitUser = User::factory()->unit()->create();
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $staffKeuangan->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create([
                'user_id' => $unitUser->id,
                'submitter_type' => 'unit',
            ]);

            // Submit and approve at StaffDirektur to reach StaffKeuangan
            app(\App\Services\ApprovalService::class)->submit($pengajuan, $unitUser);
            app(\App\Services\ApprovalService::class)->approve($pengajuan->fresh(), $staffDirektur);

            $response = $this->actingAs($staffKeuangan)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/validate", [
                    'valid_document' => true,
                    'valid_calculation' => true,
                    'valid_budget_code' => true,
                    'reasonable_cost' => true,
                    'reasonable_volume' => true,
                    'reasonable_executor' => true,
                    'reference_type' => ReferenceType::Education->value,
                    'need_lpj' => true,
                ]);

            $response->assertOk();

            $pengajuan->refresh();
            expect($pengajuan->reference_type)->toBe(ReferenceType::Education)
                ->and($pengajuan->need_lpj)->toBeTrue();
        });
    });
});
