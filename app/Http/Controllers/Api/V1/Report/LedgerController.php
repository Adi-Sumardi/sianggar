<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Http\Resources\JournalEntryResource;
use App\Http\Resources\JournalResource;
use App\Models\Account;
use App\Models\Journal;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Unit;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class LedgerController extends Controller
{
    public function __construct(
        private LedgerService $ledgerService
    ) {}

    // =========================================================================
    // Chart of Accounts
    // =========================================================================

    /**
     * List all accounts (Chart of Accounts), optionally filtered by unit.
     */
    public function accounts(Request $request): AnonymousResourceCollection
    {
        $query = Account::with(['unit', 'parent']);

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->query('tipe'));
        }

        $accounts = $query->orderBy('kode')->get();

        return AccountResource::collection($accounts);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:20', 'unique:accounts,kode'],
            'nama' => ['required', 'string', 'max:150'],
            'tipe' => ['required', 'string', Rule::in(['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban'])],
            'saldo_normal' => ['required', 'string', Rule::in(['debit', 'kredit'])],
            'parent_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')],
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'is_postable' => ['boolean'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $account = Account::create($validated);

        return response()->json([
            'message' => 'Akun berhasil dibuat.',
            'data' => new AccountResource($account),
        ], 201);
    }

    public function updateAccount(Request $request, Account $account): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('accounts', 'kode')->ignore($account->id)],
            'nama' => ['sometimes', 'required', 'string', 'max:150'],
            'tipe' => ['sometimes', 'required', 'string', Rule::in(['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban'])],
            'saldo_normal' => ['sometimes', 'required', 'string', Rule::in(['debit', 'kredit'])],
            'parent_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')],
            'is_postable' => ['boolean'],
            'aktif' => ['boolean'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $account->update($validated);

        return response()->json([
            'message' => 'Akun berhasil diperbarui.',
            'data' => new AccountResource($account),
        ]);
    }

    public function destroyAccount(Account $account): JsonResponse
    {
        if (JournalItem::where('account_id', $account->id)->exists()) {
            return response()->json([
                'message' => 'Akun tidak dapat dihapus karena sudah memiliki transaksi jurnal.',
            ], 422);
        }

        $account->delete();

        return response()->json(null, 204);
    }

    // =========================================================================
    // Journals
    // =========================================================================

    public function journals(): AnonymousResourceCollection
    {
        return JournalResource::collection(Journal::orderBy('kode')->get());
    }

    // =========================================================================
    // Journal Entries
    // =========================================================================

    public function journalEntries(Request $request): AnonymousResourceCollection
    {
        $query = JournalEntry::with(['journal', 'unit', 'items.account']);

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('journal_id')) {
            $query->where('journal_id', $request->query('journal_id'));
        }

        if ($request->filled('tahun')) {
            [$startDate, $endDate] = $this->ledgerService->tanggalRangeForTahun((string) $request->query('tahun'));
            $query->whereBetween('tanggal', [$startDate, $endDate]);
        }

        $perPage = (int) $request->query('per_page', '20');
        $entries = $query->orderByDesc('tanggal')->orderByDesc('id')->paginate($perPage);

        return JournalEntryResource::collection($entries);
    }

    public function showJournalEntry(JournalEntry $journalEntry): JsonResponse
    {
        $journalEntry->load(['journal', 'unit', 'items.account', 'creator', 'poster', 'reversalOf']);

        return response()->json([
            'data' => new JournalEntryResource($journalEntry),
        ]);
    }

    /**
     * Balik (reverse) jurnal yang sudah posted.
     */
    public function reverseJournalEntry(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $reversal = $this->ledgerService->reverseEntry(
                $journalEntry,
                $request->user(),
                $validated['notes'] ?? null,
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $reversal->load(['journal', 'unit', 'items.account']);

        return response()->json([
            'message' => 'Jurnal pembalik berhasil dibuat.',
            'data' => new JournalEntryResource($reversal),
        ], 201);
    }


    /**
     * Batalkan pembalikan jurnal yang berstatus reversed, kembalikan ke posted.
     */
    public function cancelReversal(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        try {
            $entry = $this->ledgerService->cancelReversal($journalEntry, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $entry->load(['journal', 'unit', 'items.account']);

        return response()->json([
            'message' => 'Pembalikan jurnal berhasil dibatalkan.',
            'data' => new JournalEntryResource($entry),
        ]);
    }

    // =========================================================================
    // General Ledger (Buku Besar) Report
    // =========================================================================

    /**
     * Laporan Buku Besar: mutasi kronologis sebuah akun (opsional difilter
     * per unit) dalam satu tahun, dengan saldo awal & saldo akhir.
     *
     * Untuk akun Dana Unit, saldo awal dihitung live dari total APBS unit
     * tsb (lihat LedgerService::getUnitDanaOpeningBalance), bukan 0.
     */
    public function generalLedger(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => ['required', 'integer', Rule::exists('accounts', 'id')],
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
        ]);

        $unitId = isset($validated['unit_id']) ? (int) $validated['unit_id'] : null;

        $account = Account::findOrFail($validated['account_id']);
        $unit = $unitId !== null ? Unit::find($unitId) : $account->unit;

        $result = $this->ledgerService->getAccountMutations($account, $unitId, $validated['tahun']);

        return response()->json([
            'account' => new AccountResource($account),
            'unit' => $unit ? ['id' => $unit->id, 'nama' => $unit->nama] : null,
            'tahun' => $validated['tahun'],
            'saldo_awal' => $result['saldo_awal'],
            'mutasi' => $result['mutasi'],
            'saldo_akhir' => $result['saldo_akhir'],
        ]);
    }

    /**
     * Rekening Unit: ringkasan saldo Dana Unit sebuah unit (saldo awal dari
     * APBS, mutasi kronologis, saldo akhir) — dashboard per unit.
     */
    public function unitLedger(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
        ]);

        $unit = Unit::findOrFail($validated['unit_id']);
        $account = $this->ledgerService->getOrCreateUnitDanaAccount($unit);
        $result = $this->ledgerService->getAccountMutations($account, $unit->id, $validated['tahun']);

        return response()->json([
            'unit' => ['id' => $unit->id, 'nama' => $unit->nama],
            'account' => new AccountResource($account),
            'tahun' => $validated['tahun'],
            'saldo_awal' => $result['saldo_awal'],
            'mutasi' => $result['mutasi'],
            'saldo_akhir' => $result['saldo_akhir'],
        ]);
    }

    /**
     * Neraca Saldo (Trial Balance).
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
        ]);

        try {
            $rows = $this->ledgerService->getTrialBalance(isset($validated['unit_id']) ? (int) $validated['unit_id'] : null, $validated['tahun']);
        } catch (\Throwable $e) {
            return $this->reportError('trial-balance', $validated, $e);
        }

        return response()->json([
            'tahun' => $validated['tahun'],
            'rows' => array_map(fn ($row) => [
                'account' => new AccountResource($row['account']),
                'saldo_awal' => $row['saldo_awal'],
                'total_debit' => $row['total_debit'],
                'total_kredit' => $row['total_kredit'],
                'saldo_akhir' => $row['saldo_akhir'],
            ], $rows),
        ]);
    }

    /**
     * Laporan Laba Rugi (Income Statement).
     */
    public function incomeStatement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
        ]);

        try {
            $result = $this->ledgerService->getIncomeStatement(isset($validated['unit_id']) ? (int) $validated['unit_id'] : null, $validated['tahun']);
        } catch (\Throwable $e) {
            return $this->reportError('income-statement', $validated, $e);
        }

        return response()->json([
            'tahun' => $result['tahun'],
            'pendapatan' => array_map(fn ($row) => ['account' => new AccountResource($row['account']), 'jumlah' => $row['jumlah']], $result['pendapatan']),
            'beban' => array_map(fn ($row) => ['account' => new AccountResource($row['account']), 'jumlah' => $row['jumlah']], $result['beban']),
            'total_pendapatan' => $result['total_pendapatan'],
            'total_beban' => $result['total_beban'],
            'laba_rugi' => $result['laba_rugi'],
        ]);
    }

    /**
     * Neraca (Balance Sheet).
     */
    public function balanceSheet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['nullable', 'integer', Rule::exists('units', 'id')],
            'tahun' => ['required', 'string', 'max:10'],
        ]);

        try {
            $result = $this->ledgerService->getBalanceSheet(isset($validated['unit_id']) ? (int) $validated['unit_id'] : null, $validated['tahun']);
        } catch (\Throwable $e) {
            return $this->reportError('balance-sheet', $validated, $e);
        }

        $mapRows = fn (array $rows) => array_map(fn ($row) => [
            'account' => new AccountResource($row['account']),
            'saldo' => $row['saldo'],
        ], $rows);

        return response()->json([
            'tahun' => $result['tahun'],
            'aset' => $mapRows($result['aset']),
            'kewajiban' => $mapRows($result['kewajiban']),
            'ekuitas' => $mapRows($result['ekuitas']),
            'laba_rugi_tahun_berjalan' => $result['laba_rugi_tahun_berjalan'],
            'total_aset' => $result['total_aset'],
            'total_kewajiban' => $result['total_kewajiban'],
            'total_ekuitas' => $result['total_ekuitas'],
            'total_kewajiban_dan_ekuitas' => $result['total_kewajiban_dan_ekuitas'],
        ]);
    }

    /**
     * Buat jurnal manual (penyesuaian) — minimal 2 baris, harus balance.
     */
    public function storeManualEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tanggal' => ['required', 'date'],
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'keterangan' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:2'],
            'items.*.account_id' => ['required', 'integer', Rule::exists('accounts', 'id')],
            'items.*.unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'items.*.debit' => ['required', 'numeric', 'min:0'],
            'items.*.kredit' => ['required', 'numeric', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string'],
        ]);

        try {
            $entry = $this->ledgerService->createManualEntry(
                $validated['tanggal'],
                $validated['unit_id'],
                $validated['items'],
                $validated['keterangan'] ?? null,
                $request->user(),
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $entry->load(['journal', 'unit', 'items.account']);

        return response()->json([
            'message' => 'Jurnal manual berhasil dibuat.',
            'data' => new JournalEntryResource($entry),
        ], 201);
    }

    /**
     * Log laporan buku besar yang gagal dengan konteks lengkap (endpoint,
     * parameter request, pesan & lokasi exception), lalu kembalikan 500
     * dengan pesan singkat di response — supaya bisa didiagnosis langsung
     * dari Network tab tanpa perlu akses ke storage/logs/laravel.log server.
     */
    private function reportError(string $endpoint, array $params, \Throwable $e): JsonResponse
    {
        Log::error("Ledger report [{$endpoint}] gagal", [
            'params' => $params,
            'exception' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'message' => "Gagal memuat laporan {$endpoint}: " . $e->getMessage(),
        ], 500);
    }
}
