<?php

declare(strict_types=1);

use App\Models\DetailMataAnggaran;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('budget:check-drift', function () {
    it('reports success when there is no drift', function () {
        DetailMataAnggaran::factory()->withBudget(1_000_000)->create();

        $this->artisan('budget:check-drift')
            ->expectsOutputToContain('Tidak ditemukan drift')
            ->assertExitCode(0);
    });

    it('detects rows where anggaran_awal differs from jumlah', function () {
        $drifted = DetailMataAnggaran::factory()->create([
            'jumlah' => 1_500_000,
            'anggaran_awal' => 3_000_000,
            'balance' => 3_000_000,
            'saldo_dipakai' => 0,
        ]);

        $this->artisan('budget:check-drift')
            ->expectsOutputToContain('Ditemukan 1 baris')
            ->assertExitCode(1);

        expect($drifted->fresh()->anggaran_awal)->toEqual(3_000_000);
    });

    it('fixes drifted rows with --fix when saldo_dipakai is zero', function () {
        $drifted = DetailMataAnggaran::factory()->create([
            'jumlah' => 1_500_000,
            'anggaran_awal' => 3_000_000,
            'balance' => 3_000_000,
            'saldo_dipakai' => 0,
        ]);

        $this->artisan('budget:check-drift', ['--fix' => true])
            ->expectsOutputToContain('1 baris diselaraskan, 0 baris dilewati')
            ->assertExitCode(0);

        $drifted->refresh();
        expect((float) $drifted->anggaran_awal)->toBe(1_500_000.0)
            ->and((float) $drifted->balance)->toBe(1_500_000.0);
    });

    it('skips drifted rows with --fix when saldo_dipakai is not zero', function () {
        $drifted = DetailMataAnggaran::factory()->create([
            'jumlah' => 1_500_000,
            'anggaran_awal' => 3_000_000,
            'balance' => 2_000_000,
            'saldo_dipakai' => 1_000_000,
        ]);

        $this->artisan('budget:check-drift', ['--fix' => true])
            ->expectsOutputToContain('0 baris diselaraskan, 1 baris dilewati')
            ->assertExitCode(0);

        expect((float) $drifted->fresh()->anggaran_awal)->toBe(3_000_000.0);
    });
});
