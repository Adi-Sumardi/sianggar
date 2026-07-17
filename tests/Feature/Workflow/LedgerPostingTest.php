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
use App\Services\ApprovalService;
use App\Services\LedgerService;
use App\Services\LpjApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->lpjService = new LpjApprovalService();
    $this->approvalService = new ApprovalService();
    $this->ledgerService = new LedgerService();

    // Minimal Chart of Accounts needed for LedgerService::postFromLpj()/postFromPengajuanPaid().
    $bebanGroup = Account::create([
        'kode' => '5000', 'nama' => 'Beban', 'tipe' => AccountType::Beban->value,
        'saldo_normal' => NormalBalance::Debit->value, 'is_postable' => false,
    ]);
    $this->bebanLainnya = Account::create([
        'kode' => '5400', 'nama' => 'Beban Lainnya', 'tipe' => AccountType::Beban->value,
        'saldo_normal' => NormalBalance::Debit->value, 'parent_id' => $bebanGroup->id,
    ]);
    MataAnggaranJenisAccountMap::create(['jenis' => 'belanja_lainnya', 'account_id' => $this->bebanLainnya->id]);

    Account::create([
        'kode' => '1000', 'nama' => 'Dana Internal Unit', 'tipe' => AccountType::Aset->value,
        'saldo_normal' => NormalBalance::Debit->value, 'is_postable' => false,
    ]);
    Account::create([
        'kode' => '1500', 'nama' => 'Uang Muka Kegiatan', 'tipe' => AccountType::Aset->value,
        'saldo_normal' => NormalBalance::Debit->value, 'is_postable' => false,
    ]);

    Journal::create(['kode' => 'JP', 'nama' => 'Jurnal Pengeluaran (LPJ)', 'tipe' => 'pengeluaran']);
});

it('posts a journal entry (Debit Beban / Kredit Uang Muka Kegiatan) when LPJ is fully approved', function () {
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
        ->and($entry->status->value)->toBe('draft')
        ->and($entry->unit_id)->toBe($unit->id);

    // Entry masih draft -> belum ikut terhitung di laporan (getAccountMutations
    // hanya menghitung entry Posted). Posting secara eksplisit sebelum
    // assertion-assertion di bawah yang mengecek saldo/mutasi akun.
    $this->ledgerService->postEntry($entry, $keuangan);
    $entry->refresh();
    expect($entry->status->value)->toBe('posted');

    $items = $entry->items()->get();
    expect($items)->toHaveCount(2);

    $debitItem = $items->firstWhere('debit', '>', 0);
    $kreditItem = $items->firstWhere('kredit', '>', 0);

    expect((float) $debitItem->debit)->toBe((float) $lpj->input_realisasi)
        ->and($debitItem->account_id)->toBe($this->bebanLainnya->id)
        ->and((float) $kreditItem->kredit)->toBe((float) $lpj->input_realisasi);

    // Kredit HARUS ke akun "Uang Muka Kegiatan" (grup 1500), BUKAN "Dana Unit"
    // (grup 1000) — kalau masih ke Dana Unit, dana unit akan terpotong dua
    // kali untuk pencairan yang sama (sekali di postFromPengajuanPaid, sekali
    // lagi di sini).
    $uangMukaAccount = $this->ledgerService->getOrCreateUnitUangMukaAccount($unit);
    $danaAccount = $this->ledgerService->getOrCreateUnitDanaAccount($unit);

    expect($kreditItem->account_id)->toBe($uangMukaAccount->id)
        ->and($kreditItem->account_id)->not->toBe($danaAccount->id);
});

it('does not double-count Dana Unit when a proposal goes Paid then its LPJ is fully approved', function () {
    $unit = Unit::factory()->create();
    $unitUser = User::factory()->unit()->create(['unit_id' => $unit->id]);
    $staffDirektur = User::factory()->staffDirektur()->create();
    $staffKeuangan = User::factory()->staffKeuangan()->create();
    $direktur = User::factory()->direktur()->create();
    $keuangan = User::factory()->keuangan()->create();
    $bendahara = User::factory()->bendahara()->create();
    $kasir = User::factory()->kasir()->create();
    $payment = User::factory()->payment()->create();

    $jumlah = 5_000_000;

    $pengajuan = PengajuanAnggaran::factory()->create([
        'user_id' => $unitUser->id,
        'unit_id' => $unit->id,
        'jumlah_pengajuan_total' => $jumlah,
    ]);

    // Drive the proposal all the way to Paid.
    $this->approvalService->submit($pengajuan, $unitUser);
    $this->approvalService->approve($pengajuan, $staffDirektur);
    $this->approvalService->approveWithValidation($pengajuan, $staffKeuangan, [
        'valid_document' => true,
        'valid_calculation' => true,
        'valid_budget_code' => true,
        'reasonable_cost' => true,
        'reasonable_volume' => true,
        'reasonable_executor' => true,
        'reference_type' => ReferenceType::Education->value,
        'need_lpj' => true,
    ]);
    $this->approvalService->approve($pengajuan, $direktur);
    $this->approvalService->approve($pengajuan, $keuangan);
    $this->approvalService->approve($pengajuan, $bendahara);
    $this->approvalService->printVoucher($pengajuan, $kasir);
    $this->approvalService->markAsPaid($pengajuan, $payment, 'John Doe', 'Transfer', 'Done');
    $pengajuan->refresh();

    expect($pengajuan->status_proses->value)->toBe('paid');

    $danaAccount = $this->ledgerService->getOrCreateUnitDanaAccount($unit);
    $uangMukaAccount = $this->ledgerService->getOrCreateUnitUangMukaAccount($unit);

    // Paid -> Debit Uang Muka / Kredit Dana Unit.
    $paidEntry = JournalEntry::where('sumber_type', PengajuanAnggaran::class)
        ->where('sumber_id', $pengajuan->id)
        ->first();

    expect($paidEntry)->not->toBeNull()
        ->and($paidEntry->status->value)->toBe('draft');

    // Posting eksplisit sebelum assertion saldo/mutasi lain.
    $this->ledgerService->postEntry($paidEntry, $keuangan);
    $paidEntry->refresh();
    expect($paidEntry->status->value)->toBe('posted');

    $paidItems = $paidEntry->items()->get();
    $paidDebit = $paidItems->firstWhere('debit', '>', 0);
    $paidKredit = $paidItems->firstWhere('kredit', '>', 0);

    expect((float) $paidDebit->debit)->toBe((float) $jumlah)
        ->and($paidDebit->account_id)->toBe($uangMukaAccount->id)
        ->and((float) $paidKredit->kredit)->toBe((float) $jumlah)
        ->and($paidKredit->account_id)->toBe($danaAccount->id);

    // Now realize it via LPJ, realisasi == jumlah dicairkan.
    $lpj = Lpj::factory()->draft()->create([
        'pengajuan_anggaran_id' => $pengajuan->id,
        'jumlah_pengajuan_total' => $jumlah,
        'input_realisasi' => $jumlah,
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
    $this->lpjService->approve($lpj, $keuangan, 'Final approval');
    $lpj->refresh();

    $lpjEntry = JournalEntry::where('sumber_type', Lpj::class)->where('sumber_id', $lpj->id)->first();
    expect($lpjEntry)->not->toBeNull()
        ->and($lpjEntry->status->value)->toBe('draft');

    // Posting eksplisit sebelum assertion saldo/mutasi lain.
    $this->ledgerService->postEntry($lpjEntry, $keuangan);
    $lpjEntry->refresh();
    expect($lpjEntry->status->value)->toBe('posted');

    $lpjItems = $lpjEntry->items()->get();
    $lpjKredit = $lpjItems->firstWhere('kredit', '>', 0);

    expect((float) $lpjKredit->kredit)->toBe((float) $jumlah)
        ->and($lpjKredit->account_id)->toBe($uangMukaAccount->id);

    // Dana Unit hanya dikredit SEKALI (saat Paid) — tidak dobel saat LPJ approved.
    $danaKreditTotal = (float) \App\Models\JournalItem::where('account_id', $danaAccount->id)
        ->where('kredit', '>', 0)
        ->sum('kredit');
    expect($danaKreditTotal)->toBe((float) $jumlah);

    // Uang Muka Kegiatan balance kembali netral: debit (Paid) == kredit (LPJ realisasi).
    $uangMukaDebitTotal = (float) \App\Models\JournalItem::where('account_id', $uangMukaAccount->id)->sum('debit');
    $uangMukaKreditTotal = (float) \App\Models\JournalItem::where('account_id', $uangMukaAccount->id)->sum('kredit');
    expect($uangMukaDebitTotal)->toBe($uangMukaKreditTotal);
});
