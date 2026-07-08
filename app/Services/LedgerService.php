<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AccountType;
use App\Enums\JournalEntryStatus;
use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\ActivityLog;
use App\Models\DetailMataAnggaran;
use App\Models\Journal;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Lpj;
use App\Models\MataAnggaranJenisAccountMap;
use App\Models\Penerimaan;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    /**
     * Posting jurnal buku besar saat LPJ disetujui final (realisasi riil):
     * Debit akun Beban (dipetakan dari jenis Mata Anggaran) / Kredit Dana Unit.
     *
     * Diposting sekali per LPJ — memanggil ulang untuk LPJ yang sudah
     * pernah diposting akan dilewati (idempotent).
     */
    public function postFromLpj(Lpj $lpj, ?User $postedBy = null): ?JournalEntry
    {
        $existing = JournalEntry::where('sumber_type', Lpj::class)
            ->where('sumber_id', $lpj->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $jumlah = (float) $lpj->input_realisasi;

        if ($jumlah <= 0) {
            return null;
        }

        $pengajuan = $lpj->pengajuanAnggaran;
        $unit = $pengajuan?->unitRelation;

        if (! $unit) {
            return null;
        }

        $firstDetail = $pengajuan->detailPengajuans()->with('mataAnggaran')->first();
        $jenis = $firstDetail?->mataAnggaran?->jenis;

        $bebanAccount = $this->getAccountForJenis($jenis) ?? $this->getAccountForJenis('belanja_lainnya');
        $danaAccount = $this->getOrCreateUnitDanaAccount($unit);

        if (! $bebanAccount) {
            return null;
        }

        $postedById = $postedBy?->id ?? $lpj->validated_by;

        return DB::transaction(function () use ($lpj, $unit, $jumlah, $bebanAccount, $danaAccount, $postedById) {
            $journal = Journal::where('kode', 'JP')->first();

            $entry = JournalEntry::create([
                'tanggal' => now()->toDateString(),
                'journal_id' => $journal?->id,
                'unit_id' => $unit->id,
                'sumber_type' => Lpj::class,
                'sumber_id' => $lpj->id,
                'status' => JournalEntryStatus::Posted->value,
                'keterangan' => "Realisasi LPJ {$lpj->no_surat}",
                'created_by' => $postedById,
                'posted_by' => $postedById,
                'posted_at' => now(),
            ]);

            $entry->items()->createMany([
                [
                    'account_id' => $bebanAccount->id,
                    'unit_id' => $unit->id,
                    'debit' => $jumlah,
                    'kredit' => 0,
                    'keterangan' => $lpj->perihal,
                ],
                [
                    'account_id' => $danaAccount->id,
                    'unit_id' => $unit->id,
                    'debit' => 0,
                    'kredit' => $jumlah,
                    'keterangan' => $lpj->perihal,
                ],
            ]);

            ActivityLog::log(
                $entry,
                'journal_entry_posted',
                null,
                ['sumber' => 'lpj', 'lpj_id' => $lpj->id, 'jumlah' => $jumlah],
                $postedById,
            );

            return $entry;
        });
    }

    /**
     * Posting jurnal saat Penerimaan dicatat (tidak ada alur approval,
     * jadi diposting langsung saat record dibuat): Debit Dana Unit /
     * Kredit akun Pendapatan.
     */
    public function postFromPenerimaan(Penerimaan $penerimaan): ?JournalEntry
    {
        $existing = JournalEntry::where('sumber_type', Penerimaan::class)
            ->where('sumber_id', $penerimaan->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $jumlah = (float) $penerimaan->jumlah_penerimaan;

        if ($jumlah <= 0) {
            return null;
        }

        $unit = $penerimaan->unit;

        if (! $unit) {
            return null;
        }

        $pendapatanAccount = $this->getAccountForJenis('pendapatan');
        $danaAccount = $this->getOrCreateUnitDanaAccount($unit);

        if (! $pendapatanAccount) {
            return null;
        }

        return DB::transaction(function () use ($penerimaan, $unit, $jumlah, $pendapatanAccount, $danaAccount) {
            $journal = Journal::where('kode', 'JR')->first();

            $entry = JournalEntry::create([
                'tanggal' => now()->toDateString(),
                'journal_id' => $journal?->id,
                'unit_id' => $unit->id,
                'sumber_type' => Penerimaan::class,
                'sumber_id' => $penerimaan->id,
                'status' => JournalEntryStatus::Posted->value,
                'keterangan' => "Penerimaan {$penerimaan->nama_penerimaan}",
                'posted_at' => now(),
            ]);

            $entry->items()->createMany([
                [
                    'account_id' => $danaAccount->id,
                    'unit_id' => $unit->id,
                    'debit' => $jumlah,
                    'kredit' => 0,
                    'keterangan' => $penerimaan->nama_penerimaan,
                ],
                [
                    'account_id' => $pendapatanAccount->id,
                    'unit_id' => $unit->id,
                    'debit' => 0,
                    'kredit' => $jumlah,
                    'keterangan' => $penerimaan->nama_penerimaan,
                ],
            ]);

            return $entry;
        });
    }

    /**
     * Buat jurnal pembalik untuk sebuah journal entry yang sudah posted
     * (baris debit/kredit ditukar), lalu tandai entry asal sebagai reversed.
     */
    public function reverseEntry(JournalEntry $entry, User $user, ?string $notes = null): JournalEntry
    {
        if ($entry->status !== JournalEntryStatus::Posted) {
            throw new \RuntimeException('Hanya jurnal berstatus posted yang dapat dibalik.');
        }

        return DB::transaction(function () use ($entry, $user, $notes) {
            $reversal = JournalEntry::create([
                'tanggal' => now()->toDateString(),
                'journal_id' => $entry->journal_id,
                'unit_id' => $entry->unit_id,
                'sumber_type' => $entry->sumber_type,
                'sumber_id' => $entry->sumber_id,
                'status' => JournalEntryStatus::Posted->value,
                'keterangan' => $notes ?? "Pembalik dari jurnal #{$entry->id}",
                'created_by' => $user->id,
                'posted_by' => $user->id,
                'posted_at' => now(),
                'reversal_of_id' => $entry->id,
            ]);

            foreach ($entry->items as $item) {
                $reversal->items()->create([
                    'account_id' => $item->account_id,
                    'unit_id' => $item->unit_id,
                    'debit' => $item->kredit,
                    'kredit' => $item->debit,
                    'keterangan' => $item->keterangan,
                ]);
            }

            $entry->update(['status' => JournalEntryStatus::Reversed->value]);

            return $reversal;
        });
    }

    /**
     * Saldo awal (debit) akun Dana Unit untuk sebuah tahun = total APBS unit
     * tsb, dihitung LIVE dari SUM(detail_mata_anggarans.anggaran_awal),
     * pola yang sama dengan ApbsController::applyLiveTotals.
     */
    public function getUnitDanaOpeningBalance(Unit $unit, string $tahun): float
    {
        return (float) DetailMataAnggaran::query()
            ->join('mata_anggarans', 'detail_mata_anggarans.mata_anggaran_id', '=', 'mata_anggarans.id')
            ->where('mata_anggarans.unit_id', $unit->id)
            ->where('mata_anggarans.tahun', $tahun)
            ->sum('detail_mata_anggarans.anggaran_awal');
    }

    /**
     * Ambil akun "Dana Unit" milik sebuah unit, atau buat jika belum ada
     * (unit baru yang dibuat setelah AccountSeeder dijalankan).
     */
    public function getOrCreateUnitDanaAccount(Unit $unit): Account
    {
        $account = Account::where('unit_id', $unit->id)->first();

        if ($account) {
            return $account;
        }

        $danaGroup = Account::where('kode', '1000')->first();

        return Account::create([
            'kode' => '1' . str_pad((string) $unit->id, 3, '0', STR_PAD_LEFT),
            'nama' => "Dana Unit — {$unit->nama}",
            'tipe' => AccountType::Aset->value,
            'saldo_normal' => NormalBalance::Debit->value,
            'parent_id' => $danaGroup?->id,
            'unit_id' => $unit->id,
        ]);
    }

    /**
     * Buat jurnal manual (penyesuaian) — divalidasi harus balance
     * (total debit = total kredit) dan minimal 2 baris. Langsung
     * berstatus posted (tidak ada alur draft/approval terpisah di MVP ini).
     *
     * @param  array<int, array{account_id: int, unit_id: int, debit: float, kredit: float, keterangan?: string|null}>  $items
     */
    public function createManualEntry(
        string $tanggal,
        int $unitId,
        array $items,
        ?string $keterangan,
        User $user,
    ): JournalEntry {
        if (count($items) < 2) {
            throw new \RuntimeException('Jurnal manual harus memiliki minimal 2 baris.');
        }

        $totalDebit = array_sum(array_column($items, 'debit'));
        $totalKredit = array_sum(array_column($items, 'kredit'));

        if (abs($totalDebit - $totalKredit) > 0.01) {
            throw new \RuntimeException('Total debit dan kredit harus sama (balance).');
        }

        if ($totalDebit <= 0) {
            throw new \RuntimeException('Jumlah jurnal harus lebih dari 0.');
        }

        return DB::transaction(function () use ($tanggal, $unitId, $items, $keterangan, $user) {
            $journal = Journal::where('kode', 'JU')->first();

            $entry = JournalEntry::create([
                'tanggal' => $tanggal,
                'journal_id' => $journal?->id,
                'unit_id' => $unitId,
                'status' => JournalEntryStatus::Posted->value,
                'keterangan' => $keterangan,
                'created_by' => $user->id,
                'posted_by' => $user->id,
                'posted_at' => now(),
            ]);

            foreach ($items as $item) {
                $entry->items()->create([
                    'account_id' => $item['account_id'],
                    'unit_id' => $item['unit_id'],
                    'debit' => $item['debit'] ?? 0,
                    'kredit' => $item['kredit'] ?? 0,
                    'keterangan' => $item['keterangan'] ?? null,
                ]);
            }

            ActivityLog::log(
                $entry,
                'journal_entry_posted',
                null,
                ['sumber' => 'manual', 'jumlah' => array_sum(array_column($items, 'debit'))],
                $user->id,
            );

            return $entry;
        });
    }

    /**
     * Mutasi kronologis sebuah akun (opsional difilter per unit) dalam satu
     * tahun, dengan saldo awal & saldo akhir. Dipakai oleh laporan Buku
     * Besar & Rekening Unit.
     *
     * @return array{saldo_awal: float, mutasi: array<int, array<string, mixed>>, saldo_akhir: float}
     */
    public function getAccountMutations(Account $account, ?int $unitId, string $tahun): array
    {
        $saldoAwal = 0.0;
        if ($account->unit_id !== null && $account->unit !== null) {
            $saldoAwal = $this->getUnitDanaOpeningBalance($account->unit, $tahun);
        }

        $itemsQuery = JournalItem::query()
            ->with(['journalEntry'])
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($tahun) {
                $q->where('status', JournalEntryStatus::Posted->value)
                    ->whereYear('tanggal', $tahun);
            });

        if ($unitId !== null) {
            $itemsQuery->where('unit_id', $unitId);
        }

        // Baris tanpa journalEntry (mis. data yatim) dibuang lebih dulu supaya
        // tidak memicu error saat mengakses properti null di bawah.
        $items = $itemsQuery->get()
            ->filter(fn ($item) => $item->journalEntry !== null)
            ->sortBy(fn ($item) => $item->journalEntry->tanggal)
            ->values();

        $runningBalance = $saldoAwal;
        $normalBalance = $account->saldo_normal;

        $mutasi = $items->map(function (JournalItem $item) use (&$runningBalance, $normalBalance) {
            $delta = $normalBalance === 'debit'
                ? ((float) $item->debit - (float) $item->kredit)
                : ((float) $item->kredit - (float) $item->debit);

            $runningBalance += $delta;

            return [
                'tanggal' => $item->journalEntry->tanggal->toDateString(),
                'no_bukti' => $item->journalEntry->no_bukti,
                'keterangan' => $item->keterangan ?? $item->journalEntry->keterangan,
                'debit' => (float) $item->debit,
                'kredit' => (float) $item->kredit,
                'saldo' => $runningBalance,
            ];
        })->values()->all();

        return [
            'saldo_awal' => $saldoAwal,
            'mutasi' => $mutasi,
            'saldo_akhir' => $runningBalance,
        ];
    }

    /**
     * Neraca Saldo (Trial Balance): semua akun postable (opsional difilter
     * per unit — akun global tetap ikut, akun milik unit lain disembunyikan),
     * dengan saldo awal, total debit, total kredit, saldo akhir per tahun.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getTrialBalance(?int $unitId, string $tahun): array
    {
        $query = Account::where('is_postable', true)->where('aktif', true);

        if ($unitId !== null) {
            $query->where(function ($q) use ($unitId) {
                $q->whereNull('unit_id')->orWhere('unit_id', $unitId);
            });
        }

        return $query->orderBy('kode')->get()->map(function (Account $account) use ($unitId, $tahun) {
            $result = $this->getAccountMutations($account, $unitId, $tahun);

            $totalDebit = array_sum(array_column($result['mutasi'], 'debit'));
            $totalKredit = array_sum(array_column($result['mutasi'], 'kredit'));

            return [
                'account' => $account,
                'saldo_awal' => $result['saldo_awal'],
                'total_debit' => $totalDebit,
                'total_kredit' => $totalKredit,
                'saldo_akhir' => $result['saldo_akhir'],
            ];
        })->values()->all();
    }

    /**
     * Laporan Laba Rugi (Income Statement): total Pendapatan - total Beban
     * untuk sebuah tahun (opsional difilter per unit). Akun Pendapatan/Beban
     * adalah akun arus (flow), jadi tidak punya saldo awal — hanya mutasi
     * bersih periode berjalan yang relevan.
     */
    public function getIncomeStatement(?int $unitId, string $tahun): array
    {
        $mapAccount = function (Account $account) use ($unitId, $tahun) {
            $result = $this->getAccountMutations($account, $unitId, $tahun);
            $totalDebit = array_sum(array_column($result['mutasi'], 'debit'));
            $totalKredit = array_sum(array_column($result['mutasi'], 'kredit'));

            $jumlah = $account->saldo_normal === 'kredit'
                ? $totalKredit - $totalDebit
                : $totalDebit - $totalKredit;

            return ['account' => $account, 'jumlah' => $jumlah];
        };

        $accountQuery = fn (string $tipe) => Account::where('tipe', $tipe)
            ->where('is_postable', true)
            ->when($unitId !== null, fn ($q) => $q->where(function ($sub) use ($unitId) {
                $sub->whereNull('unit_id')->orWhere('unit_id', $unitId);
            }))
            ->orderBy('kode')
            ->get();

        $pendapatan = $accountQuery(AccountType::Pendapatan->value)->map($mapAccount)->values()->all();
        $beban = $accountQuery(AccountType::Beban->value)->map($mapAccount)->values()->all();

        $totalPendapatan = array_sum(array_column($pendapatan, 'jumlah'));
        $totalBeban = array_sum(array_column($beban, 'jumlah'));

        return [
            'tahun' => $tahun,
            'pendapatan' => $pendapatan,
            'beban' => $beban,
            'total_pendapatan' => $totalPendapatan,
            'total_beban' => $totalBeban,
            'laba_rugi' => $totalPendapatan - $totalBeban,
        ];
    }

    /**
     * Neraca (Balance Sheet) sederhana per akhir tahun: Aset, Kewajiban,
     * Ekuitas (saldo akhir kumulatif termasuk saldo awal), ditambah baris
     * "Laba (Rugi) Tahun Berjalan" dari getIncomeStatement() di bawah Ekuitas.
     */
    public function getBalanceSheet(?int $unitId, string $tahun): array
    {
        $mapAccount = function (Account $account) use ($unitId, $tahun) {
            $result = $this->getAccountMutations($account, $unitId, $tahun);

            return ['account' => $account, 'saldo' => $result['saldo_akhir']];
        };

        $accountQuery = fn (string $tipe) => Account::where('tipe', $tipe)
            ->where('is_postable', true)
            ->when($unitId !== null, fn ($q) => $q->where(function ($sub) use ($unitId) {
                $sub->whereNull('unit_id')->orWhere('unit_id', $unitId);
            }))
            ->orderBy('kode')
            ->get();

        $aset = $accountQuery(AccountType::Aset->value)->map($mapAccount)->values()->all();
        $kewajiban = $accountQuery(AccountType::Kewajiban->value)->map($mapAccount)->values()->all();
        $ekuitas = $accountQuery(AccountType::Ekuitas->value)->map($mapAccount)->values()->all();

        $labaRugi = $this->getIncomeStatement($unitId, $tahun)['laba_rugi'];

        $totalAset = array_sum(array_column($aset, 'saldo'));
        $totalKewajiban = array_sum(array_column($kewajiban, 'saldo'));
        $totalEkuitas = array_sum(array_column($ekuitas, 'saldo')) + $labaRugi;

        return [
            'tahun' => $tahun,
            'aset' => $aset,
            'kewajiban' => $kewajiban,
            'ekuitas' => $ekuitas,
            'laba_rugi_tahun_berjalan' => $labaRugi,
            'total_aset' => $totalAset,
            'total_kewajiban' => $totalKewajiban,
            'total_ekuitas' => $totalEkuitas,
            'total_kewajiban_dan_ekuitas' => $totalKewajiban + $totalEkuitas,
        ];
    }

    private function getAccountForJenis(?string $jenis): ?Account
    {
        if (! $jenis) {
            return null;
        }

        return MataAnggaranJenisAccountMap::where('jenis', $jenis)->first()?->account;
    }
}
