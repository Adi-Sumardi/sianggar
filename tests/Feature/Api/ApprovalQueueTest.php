<?php

declare(strict_types=1);

use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\ProposalStatus;
use App\Models\Approval;
use App\Models\Discussion;
use App\Models\DiscussionMessage;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\PerubahanAnggaran;
use App\Models\Rapbs;
use App\Models\RapbsApproval;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::create(['name' => 'view-proposals', 'guard_name' => 'web']);
    Permission::create(['name' => 'approve-proposals', 'guard_name' => 'web']);
    Permission::create(['name' => 'view-budget', 'guard_name' => 'web']);
});

describe('Approval Queue - Pengajuan Anggaran', function () {
    describe('GET /api/v1/approval-queue', function () {
        it('returns pending pengajuan for staff direktur', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            // Create pengajuan at StaffDirektur stage
            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($staffDirektur)
                ->getJson('/api/v1/approval-queue');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_pengajuan',
                            'perihal',
                            'status_proses',
                        ],
                    ],
                ]);
        });

        it('returns empty for user with no pending approvals', function () {
            $kasir = User::factory()->kasir()->create();
            $kasir->givePermissionTo('approve-proposals');

            // Create pengajuan at a different stage
            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($kasir)
                ->getJson('/api/v1/approval-queue');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(0);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/approval-queue');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/approval-queue');

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/pengajuan/{id}/approve', function () {
        it('approves pengajuan and moves to next stage', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'current_approval_stage' => ApprovalStage::StaffDirektur->value,
            ]);
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/approve", [
                    'notes' => 'Approved',
                ]);

            $response->assertOk()
                ->assertJsonPath('message', 'Pengajuan berhasil disetujui.');
        });
    });

    describe('POST /api/v1/pengajuan/{id}/revise', function () {
        it('returns pengajuan for revision with notes', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'current_approval_stage' => ApprovalStage::StaffDirektur->value,
            ]);
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/revise", [
                    'notes' => 'Perlu perbaikan dokumen',
                ]);

            $response->assertOk()
                ->assertJsonPath('message', 'Pengajuan dikembalikan untuk revisi.');

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::RevisionRequired);
        });

        it('requires notes for revision', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/reject', function () {
        it('rejects pengajuan permanently', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            $staffDirektur->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create([
                'current_approval_stage' => ApprovalStage::StaffDirektur->value,
            ]);
            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => ApprovalStage::StaffDirektur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            $response = $this->actingAs($staffDirektur)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/reject", [
                    'notes' => 'Tidak sesuai kebijakan',
                ]);

            $response->assertOk()
                ->assertJsonPath('message', 'Pengajuan ditolak.');

            $pengajuan->refresh();
            expect($pengajuan->status_proses)->toBe(ProposalStatus::Rejected);
        });
    });
});

describe('Approval Queue - LPJ', function () {
    describe('POST /api/v1/lpj/{id}/revise', function () {
        it('requires notes for revision', function () {
            $staffKeuangan = User::factory()->staffKeuangan()->create();
            $staffKeuangan->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->paid()->needsLpj()->create();
            $lpj = Lpj::factory()->submitted()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            $response = $this->actingAs($staffKeuangan)
                ->postJson("/api/v1/lpj/{$lpj->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/lpj/{id}/approve', function () {
        it('returns 401 for unauthenticated request', function () {
            $lpj = Lpj::factory()->submitted()->create();

            $response = $this->postJson("/api/v1/lpj/{$lpj->id}/approve");

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();
            $lpj = Lpj::factory()->submitted()->create();

            $response = $this->actingAs($user)
                ->postJson("/api/v1/lpj/{$lpj->id}/approve");

            $response->assertForbidden();
        });
    });
});

describe('Approval Queue - RAPBS', function () {
    describe('GET /api/v1/rapbs-approval/pending', function () {
        it('returns pending RAPBS approvals for direktur', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $unit = Unit::factory()->create();
            $rapbs = Rapbs::factory()->forUnit($unit)->submitted()->create();

            $response = $this->actingAs($direktur)
                ->getJson('/api/v1/rapbs-approval/pending');

            $response->assertOk()
                ->assertJsonStructure([
                    'data',
                ]);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/v1/rapbs-approval/pending');

            $response->assertUnauthorized();
        });

        it('returns 403 without permission', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->getJson('/api/v1/rapbs-approval/pending');

            $response->assertForbidden();
        });
    });

    describe('POST /api/v1/rapbs/{id}/revise', function () {
        it('requires notes for revision', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $unit = Unit::factory()->create();
            $rapbs = Rapbs::factory()->forUnit($unit)->submitted()->create();

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/rapbs/{$rapbs->id}/revise", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });

    describe('POST /api/v1/rapbs/{id}/reject', function () {
        it('requires notes for rejection', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            $unit = Unit::factory()->create();
            $rapbs = Rapbs::factory()->forUnit($unit)->submitted()->create();

            $response = $this->actingAs($direktur)
                ->postJson("/api/v1/rapbs/{$rapbs->id}/reject", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['notes']);
        });
    });
});

describe('Approval Queue - Perubahan Anggaran (Geser Anggaran)', function () {
    describe('GET /api/v1/perubahan-anggaran-queue', function () {
        it('returns pending perubahan anggaran for direktur', function () {
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
                ->getJson('/api/v1/perubahan-anggaran-queue');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_perubahan',
                            'perihal',
                            'status',
                        ],
                    ],
                ]);

            expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
        });

        it('returns only items at user role stage', function () {
            $direktur = User::factory()->direktur()->create();
            $direktur->givePermissionTo('approve-proposals');

            // Perubahan at Direktur stage (should appear)
            $perubahan1 = PerubahanAnggaran::factory()->submitted()->create();
            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan1->id,
                'stage' => ApprovalStage::Direktur->value,
                'stage_order' => 1,
                'status' => ApprovalStatus::Pending->value,
            ]);

            // Perubahan at WakilKetua stage (should not appear)
            $perubahan2 = PerubahanAnggaran::factory()->approvedLevel1()->create();
            Approval::create([
                'approvable_type' => PerubahanAnggaran::class,
                'approvable_id' => $perubahan2->id,
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

describe('Discussion Feature', function () {
    describe('GET /api/v1/discussions/active', function () {
        it('returns active discussions', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->open()->forPengajuan($pengajuan)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/discussions/active');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'status',
                            'opened_at',
                        ],
                    ],
                ]);
        });

        it('does not return closed discussions', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->closed()->forPengajuan($pengajuan)->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/discussions/active');

            $response->assertOk();
            expect(count($response->json('data')))->toBe(0);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/discussion/open', function () {
        it('opens a new discussion on pengajuan for ketum', function () {
            // Ketum can open discussions
            $ketum = User::factory()->ketum()->create();
            $ketum->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();

            $response = $this->actingAs($ketum)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/open");

            $response->assertOk()
                ->assertJsonPath('message', 'Diskusi berhasil dibuka.');

            expect(Discussion::where('pengajuan_anggaran_id', $pengajuan->id)->count())->toBe(1);
        });

        it('cannot open discussion if one is already active', function () {
            $ketum = User::factory()->ketum()->create();
            $ketum->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->open()->forPengajuan($pengajuan)->openedBy($ketum)->create();

            $response = $this->actingAs($ketum)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/open");

            $response->assertUnprocessable();
        });
    });

    describe('POST /api/v1/pengajuan/{id}/discussion/close', function () {
        it('closes an active discussion by opener', function () {
            // Ketum can open/close discussions (and only opener can close)
            $ketum = User::factory()->ketum()->create();
            $ketum->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->open()->forPengajuan($pengajuan)->openedBy($ketum)->create();

            $response = $this->actingAs($ketum)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/close");

            $response->assertOk()
                ->assertJsonPath('message', 'Diskusi berhasil ditutup.');

            $discussion = Discussion::where('pengajuan_anggaran_id', $pengajuan->id)->first();
            expect($discussion->status)->toBe('closed');
        });

        it('cannot close if no active discussion', function () {
            $ketum = User::factory()->ketum()->create();
            $ketum->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();

            $response = $this->actingAs($ketum)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/close");

            $response->assertUnprocessable();
        });
    });

    describe('GET /api/v1/pengajuan/{id}/discussion', function () {
        it('returns discussion history with messages', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            $discussion = Discussion::factory()->open()->forPengajuan($pengajuan)->create();
            DiscussionMessage::create([
                'discussion_id' => $discussion->id,
                'user_id' => $admin->id,
                'message' => 'Test message',
            ]);

            $response = $this->actingAs($admin)
                ->getJson("/api/v1/pengajuan/{$pengajuan->id}/discussion");

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'status',
                            'messages',
                        ],
                    ],
                ]);
        });
    });

    describe('POST /api/v1/pengajuan/{id}/discussion/message', function () {
        it('adds a message to active discussion', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->open()->forPengajuan($pengajuan)->create();

            $response = $this->actingAs($admin)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/message", [
                    'message' => 'Ini pesan diskusi baru',
                ]);

            $response->assertCreated()
                ->assertJsonPath('message', 'Pesan berhasil ditambahkan.')
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'message',
                        'user',
                    ],
                ]);
        });

        it('requires message content', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();
            Discussion::factory()->open()->forPengajuan($pengajuan)->create();

            $response = $this->actingAs($admin)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/message", []);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['message']);
        });

        it('cannot add message if no active discussion', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            $pengajuan = PengajuanAnggaran::factory()->submitted()->create();

            $response = $this->actingAs($admin)
                ->postJson("/api/v1/pengajuan/{$pengajuan->id}/discussion/message", [
                    'message' => 'Test message',
                ]);

            $response->assertUnprocessable();
        });
    });
});

describe('Voucher and Payment History', function () {
    describe('GET /api/v1/voucher-history', function () {
        it('returns printed voucher history', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            // Create pengajuan with printed voucher
            PengajuanAnggaran::factory()->create([
                'no_voucher' => '001/01/2026',
                'print_status' => 'printed',
            ]);

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/voucher-history');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_pengajuan',
                            'no_voucher',
                        ],
                    ],
                ]);
        });
    });

    describe('GET /api/v1/payment-history', function () {
        it('returns payment history', function () {
            $admin = User::factory()->admin()->create();
            $admin->givePermissionTo('approve-proposals');

            // Create paid pengajuan
            PengajuanAnggaran::factory()->paid()->create();

            $response = $this->actingAs($admin)
                ->getJson('/api/v1/payment-history');

            $response->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nomor_pengajuan',
                            'paid_at',
                        ],
                    ],
                ]);
        });
    });
});
