<?php

declare(strict_types=1);

use App\Enums\ReferenceType;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Models\RealisasiAnggaran;
use App\Models\Unit;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->lpjService = new LpjApprovalService();
});

it('creates a RealisasiAnggaran row automatically when LPJ is fully approved', function () {
    $unit = Unit::factory()->create();
    $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
    $staffKeuangan = User::factory()->staffKeuangan()->create();
    $direktur = User::factory()->direktur()->create();
    $keuangan = User::factory()->keuangan()->create();

    $pengajuan = PengajuanAnggaran::factory()->create([
        'user_id' => $unitUser->id,
        'unit_id' => $unit->id,
        'jumlah_pengajuan_total' => 2_000_000,
    ]);
    $lpj = Lpj::factory()->draft()->create([
        'pengajuan_anggaran_id' => $pengajuan->id,
        'jumlah_pengajuan_total' => 2_000_000,
        'input_realisasi' => 1_800_000,
    ]);

    $this->lpjService->submit($lpj, $unitUser);
    $this->lpjService->validate($lpj->fresh(), $staffKeuangan, [
        'has_activity_identity' => true,
        'has_cover_letter' => true,
        'has_narrative_report' => true,
        'has_financial_report' => true,
        'has_receipts' => true,
        'reference_type' => ReferenceType::Education->value,
    ]);
    $lpj->refresh();
    $this->lpjService->approve($lpj, $direktur, 'Approved');
    $lpj->refresh();

    // Belum final approved -> belum ada realisasi.
    expect(RealisasiAnggaran::where('lpj_id', $lpj->id)->exists())->toBeFalse();

    $this->lpjService->approve($lpj, $keuangan, 'Final approval');
    $lpj->refresh();

    $realisasi = RealisasiAnggaran::where('lpj_id', $lpj->id)->first();

    expect($realisasi)->not->toBeNull()
        ->and($realisasi->unit_id)->toBe($unit->id)
        ->and($realisasi->tahun)->toBe($lpj->tahun)
        ->and((float) $realisasi->jumlah_anggaran)->toBe(2_000_000.0)
        ->and((float) $realisasi->jumlah_realisasi)->toBe(1_800_000.0)
        ->and((float) $realisasi->sisa)->toBe(200_000.0)
        ->and((float) $realisasi->persentase)->toBe(90.0);
});
