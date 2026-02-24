<?php

declare(strict_types=1);

use App\Models\Discussion;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Discussion Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $opener = User::factory()->create();

            $discussion = Discussion::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'status' => 'open',
                'opened_by' => $opener->id,
                'opened_at' => now(),
            ]);

            expect($discussion->pengajuan_anggaran_id)->toBe($pengajuan->id)
                ->and($discussion->status)->toBe('open')
                ->and($discussion->opened_by)->toBe($opener->id);
        });

        it('casts opened_at to datetime', function () {
            $discussion = Discussion::factory()->create();

            expect($discussion->opened_at)->toBeInstanceOf(\Carbon\Carbon::class);
        });

        it('casts closed_at to datetime when set', function () {
            $discussion = Discussion::factory()->closed()->create();

            expect($discussion->closed_at)->toBeInstanceOf(\Carbon\Carbon::class);
        });
    });

    describe('relationships', function () {
        it('belongs to pengajuan anggaran', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $discussion = Discussion::factory()->create([
                'pengajuan_anggaran_id' => $pengajuan->id,
            ]);

            expect($discussion->pengajuanAnggaran)->toBeInstanceOf(PengajuanAnggaran::class)
                ->and($discussion->pengajuanAnggaran->id)->toBe($pengajuan->id);
        });

        it('belongs to opener user', function () {
            $opener = User::factory()->create();
            $discussion = Discussion::factory()->create([
                'opened_by' => $opener->id,
            ]);

            expect($discussion->opener)->toBeInstanceOf(User::class)
                ->and($discussion->opener->id)->toBe($opener->id);
        });

        it('belongs to closer user when closed', function () {
            $closer = User::factory()->create();
            $discussion = Discussion::factory()->create([
                'status' => 'closed',
                'closed_by' => $closer->id,
                'closed_at' => now(),
            ]);

            expect($discussion->closer)->toBeInstanceOf(User::class)
                ->and($discussion->closer->id)->toBe($closer->id);
        });

        it('has null closer when open', function () {
            $discussion = Discussion::factory()->open()->create();

            expect($discussion->closer)->toBeNull();
        });
    });

    describe('factory states', function () {
        it('creates open discussion', function () {
            $discussion = Discussion::factory()->open()->create();

            expect($discussion->status)->toBe('open')
                ->and($discussion->closed_by)->toBeNull()
                ->and($discussion->closed_at)->toBeNull();
        });

        it('creates closed discussion', function () {
            $discussion = Discussion::factory()->closed()->create();

            expect($discussion->status)->toBe('closed')
                ->and($discussion->closed_by)->not->toBeNull()
                ->and($discussion->closed_at)->not->toBeNull();
        });

        it('creates discussion with specific opener', function () {
            $opener = User::factory()->create();
            $discussion = Discussion::factory()->openedBy($opener)->create();

            expect($discussion->opened_by)->toBe($opener->id);
        });

        it('creates discussion for specific pengajuan', function () {
            $pengajuan = PengajuanAnggaran::factory()->create();
            $discussion = Discussion::factory()->forPengajuan($pengajuan)->create();

            expect($discussion->pengajuan_anggaran_id)->toBe($pengajuan->id);
        });
    });

    describe('status management', function () {
        it('can close an open discussion', function () {
            $discussion = Discussion::factory()->open()->create();
            $closer = User::factory()->create();

            $discussion->update([
                'status' => 'closed',
                'closed_by' => $closer->id,
                'closed_at' => now(),
            ]);

            expect($discussion->status)->toBe('closed')
                ->and($discussion->closed_by)->toBe($closer->id);
        });

        it('tracks when discussion was opened', function () {
            $openedAt = now()->subHours(2);
            $discussion = Discussion::factory()->create([
                'opened_at' => $openedAt,
            ]);

            expect($discussion->opened_at->format('Y-m-d H:i'))->toBe($openedAt->format('Y-m-d H:i'));
        });
    });
});
