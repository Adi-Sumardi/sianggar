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

    private function getAccountForJenis(?string $jenis): ?Account
    {
        if (! $jenis) {
            return null;
        }

        return MataAnggaranJenisAccountMap::where('jenis', $jenis)->first()?->account;
    }
}
