<?php

declare(strict_types=1);

use App\Enums\AccountType;
use App\Enums\NormalBalance;
use App\Enums\ReferenceType;
use App\Models\Account;
use App\Models\Journal;
use App\Models\JournalEntry;
use App\Models\Lpj;
use App\Models\MataAnggaranJenisAccountMap;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->lpjService = new LpjApprovalService();

    // Minimal Chart of Accounts needed for LedgerService::postFromLpj().
    $bebanGroup = Account::create([
        'kode' => '5000', 'nama' => 'Beban', 'tipe' => AccountType::Beban->value,
        'saldo_normal' => NormalBalance::Debit->value, 'is_postable' => false,
    ]);
    $this->bebanLainnya = Account::create([
        'kode' => '5400', 'nama' => 'Beban Lainnya', 'tipe' => AccountType::Beban->value,
        'saldo_normal' => NormalBalance::Debit->value, 'parent_id' => $bebanGroup->id,
    ]);
    MataAnggaranJenisAccountMap::create(['jenis' => 'belanja_lainnya', 'account_id' => $this->bebanLainnya->id]);

    Journal::create(['kode' => 'JP', 'nama' => 'Jurnal Pengeluaran (LPJ)', 'tipe' => 'pengeluaran']);
});

it('posts a journal entry (Debit Beban / Kredit Dana Unit) when LPJ is fully approved', function () {
    $unit = Unit::factory()->create();
    $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
    $staffKeuangan = User::factory()->staffKeuangan()->create();
    $direktur = User::factory()->direktur()->create();
    $keuangan = User::factory()->keuangan()->create();

    $pengajuan = PengajuanAnggaran::factory()->create(['user_id' => $unitUser->id, 'unit_id' => $unit->id]);
    $lpj = Lpj::factory()->draft()->create(['pengajuan_anggaran_id' => $pengajuan->id]);

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

    // Not yet fully approved -> no ledger posting yet.
    expect(JournalEntry::where('sumber_type', Lpj::class)->where('sumber_id', $lpj->id)->exists())->toBeFalse();

    $this->lpjService->approve($lpj, $keuangan, 'Final approval');
    $lpj->refresh();

    $entry = JournalEntry::where('sumber_type', Lpj::class)->where('sumber_id', $lpj->id)->first();

    expect($entry)->not->toBeNull()
        ->and($entry->status->value)->toBe('posted')
        ->and($entry->unit_id)->toBe($unit->id);

    $items = $entry->items()->get();
    expect($items)->toHaveCount(2);

    $debitItem = $items->firstWhere('debit', '>', 0);
    $kreditItem = $items->firstWhere('kredit', '>', 0);

    expect((float) $debitItem->debit)->toBe((float) $lpj->input_realisasi)
        ->and($debitItem->account_id)->toBe($this->bebanLainnya->id)
        ->and((float) $kreditItem->kredit)->toBe((float) $lpj->input_realisasi);

    $danaAccount = Account::where('unit_id', $unit->id)->first();
    expect($danaAccount)->not->toBeNull()
        ->and($kreditItem->account_id)->toBe($danaAccount->id);
});
