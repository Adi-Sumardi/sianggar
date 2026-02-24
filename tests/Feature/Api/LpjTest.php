<?php

declare(strict_types=1);

use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();

    // Create necessary permissions
    Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);
    Permission::create(['name' => 'create-lpj', 'guard_name' => 'web']);
    Permission::create(['name' => 'approve-proposals', 'guard_name' => 'web']);
});

describe('LPJ API', function () {
    describe('GET /api/v1/lpj', function () {
        it('returns paginated list of LPJ', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            Lpj::factory()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/lpj');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'no_surat',
                            'perihal',
                            'proses',
                            'jumlah_pengajuan_total',
                        ],
                    ],
                    'meta' => ['current_page', 'total'],
                ]);
        });

        it('filters by status', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            Lpj::factory()->draft()->count(3)->create();
            Lpj::factory()->submitted()->count(2)->create();
            Lpj::factory()->approved()->count(1)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/lpj?proses=draft');

            $response->assertOk();
            expect($response->json('meta.total'))->toBe(3);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/lpj');

            $response->assertUnauthorized();
        });
    });

    describe('GET /api/v1/lpj/stats', function () {
        it('returns LPJ statistics', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            Lpj::factory()->draft()->count(3)->create();
            Lpj::factory()->submitted()->count(2)->create();
            Lpj::factory()->approved()->count(5)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/lpj/stats');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'pending_lpj_count',
                        'revised_lpj_count',
                        'revised_pengajuan_count',
                        'can_create_pengajuan',
                    ],
                ]);
        });
    });

    describe('POST /api/v1/lpj', function () {
        it('creates a new LPJ from pengajuan', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->approved()->needsLpj()->create([
                'user_id' => $user->id,
            ]);

            $data = [
                'pengajuan_anggaran_id' => $pengajuan->id,
                'perihal' => 'LPJ Test Event',
                'deskripsi_singkat' => 'Event description',
                'tgl_kegiatan' => '2025-01-15',
                'input_realisasi' => 4500000,
                'unit' => 'SD',
                'jumlah_pengajuan_total' => 5000000,
                'tahun' => '2025',
            ];

            $response = $this->actingAs($user)
                ->postJson('/api/v1/lpj', $data);

            $response->assertCreated()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'no_surat',
                        'perihal',
                        'proses',
                    ],
                ])
                ->assertJsonPath('data.proses', LpjStatus::Draft->value);
        });

        it('validates required fields', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $response = $this->actingAs($user)
                ->postJson('/api/v1/lpj', []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['pengajuan_anggaran_id', 'perihal']);
        });
    });

    describe('GET /api/v1/lpj/{id}', function () {
        it('returns LPJ details', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            $lpj = Lpj::factory()->create();

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/lpj/{$lpj->id}");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'no_surat',
                        'perihal',
                        'proses',
                        'pengajuan_anggaran',
                        'approvals',
                    ],
                ])
                ->assertJsonPath('data.id', $lpj->id);
        });

        it('returns 404 for non-existent LPJ', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/lpj/999999');

            $response->assertNotFound();
        });
    });

    describe('GET /api/v1/lpj/{id}/timeline', function () {
        it('returns approval timeline', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('view-reports');

            $lpj = Lpj::factory()->validated()->create();

            // Create approval records
            Approval::factory()->approved()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::StaffKeuangan->value,
                'stage_order' => 1,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
                'stage_order' => 2,
            ]);

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/lpj/{$lpj->id}/timeline");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'stage',
                            'label',
                            'status',
                        ],
                    ],
                ]);
        });
    });

    describe('PUT /api/v1/lpj/{id}', function () {
        it('updates a draft LPJ', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/lpj/{$lpj->id}", [
                    'perihal' => 'Updated LPJ',
                    'input_realisasi' => 3500000,
                ]);

            $response->assertOk()
                ->assertJsonPath('data.perihal', 'Updated LPJ');
        });

        it('cannot update non-draft LPJ', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);
            $lpj = Lpj::factory()->submitted()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $response = $this->actingAs($user)
                ->putJson("/api/v1/lpj/{$lpj->id}", [
                    'perihal' => 'Updated LPJ',
                ]);

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/lpj/{id}/submit', function () {
        it('submits a draft LPJ', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/lpj/{$lpj->id}/submit");

            $response->assertOk()
                ->assertJsonPath('data.proses', LpjStatus::Submitted->value)
                ->assertJsonPath('data.current_approval_stage', LpjApprovalStage::StaffKeuangan->value);
        });
    });

    describe('POST /api/v1/lpj/{id}/resubmit', function () {
        it('resubmits a revised LPJ', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);
            $lpj = Lpj::factory()->revised()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'revision_requested_stage' => LpjApprovalStage::StaffKeuangan->value,
            ]);

            $response = $this->actingAs($user)
                ->postJson("/api/v1/lpj/{$lpj->id}/resubmit");

            $response->assertOk()
                ->assertJsonPath('data.current_approval_stage', LpjApprovalStage::StaffKeuangan->value);
        });
    });

    describe('DELETE /api/v1/lpj/{id}', function () {
        it('deletes a draft LPJ', function () {
            $user = User::factory()->unit('sd')->create();
            $user->givePermissionTo('create-lpj');

            $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $user->id]);
            $lpj = Lpj::factory()->draft()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $response = $this->actingAs($user)
                ->deleteJson("/api/v1/lpj/{$lpj->id}");

            $response->assertNoContent();
            expect(Lpj::find($lpj->id))->toBeNull();
        });
    });
});

describe('LPJ Approval API', function () {
    describe('POST /api/v1/lpj/{id}/validate', function () {
        it('validates LPJ with checklist at StaffKeuangan stage', function () {
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $staffKeuangan->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->submitted()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            // Create pending approval
            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::StaffKeuangan->value,
            ]);

            $response = $this->actingAs($staffKeuangan)
                ->postJson("/api/v1/lpj/{$lpj->id}/validate", [
                    'has_activity_identity' => true,
                    'has_cover_letter' => true,
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::Education->value,
                    'notes' => 'All documents complete',
                ]);

            $response->assertOk();

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Validated)
                ->and($lpj->reference_type)->toBe(ReferenceType::Education)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Direktur);
        });

        it('returns error when checklist is incomplete', function () {
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $staffKeuangan->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->submitted()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::StaffKeuangan->value,
            ]);

            $response = $this->actingAs($staffKeuangan)
                ->postJson("/api/v1/lpj/{$lpj->id}/validate", [
                    'has_activity_identity' => true,
                    'has_cover_letter' => false, // Missing
                    'has_narrative_report' => true,
                    'has_financial_report' => true,
                    'has_receipts' => true,
                    'reference_type' => ReferenceType::Education->value,
                ]);

            $response->assertUnprocessable();
        });
    });

    describe('POST /api/v1/lpj/{id}/approve', function () {
        it('approves LPJ at Direktur stage', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->validated()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/lpj/{$lpj->id}/approve", [
                    'notes' => 'Approved',
                ]);

            $response->assertOk();

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::ApprovedByMiddle)
                ->and($lpj->current_approval_stage)->toBe(LpjApprovalStage::Keuangan);
        });

        it('final approval at Keuangan stage', function () {
            $keuangan = User::factory()->keuangan()->create();
            $keuangan->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->approvedByMiddle()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Keuangan->value,
            ]);

            $response = $this->actingAs($keuangan)
                ->postJson("/api/v1/lpj/{$lpj->id}/approve", [
                    'notes' => 'Final approval',
                ]);

            $response->assertOk();

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Approved)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });

    describe('POST /api/v1/lpj/{id}/revise', function () {
        it('requests revision with notes', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->validated()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/lpj/{$lpj->id}/revise", [
                    'notes' => 'Please add more documentation',
                ]);

            $response->assertOk();

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Revised)
                ->and($lpj->revision_requested_stage)->toBe(LpjApprovalStage::Direktur->value);
        });

        it('requires notes for revision', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->validated()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/lpj/{$lpj->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/lpj/{id}/reject', function () {
        it('rejects LPJ permanently', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->create();
            $lpj = Lpj::factory()->validated()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            Approval::factory()->pending()->create([
                'approvable_type' => Lpj::class,
                'approvable_id' => $lpj->id,
                'stage' => LpjApprovalStage::Direktur->value,
            ]);

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/lpj/{$lpj->id}/reject", [
                    'notes' => 'Documentation insufficient',
                ]);

            $response->assertOk();

            $lpj->refresh();
            expect($lpj->proses)->toBe(LpjStatus::Rejected)
                ->and($lpj->current_approval_stage)->toBeNull();
        });
    });
});
