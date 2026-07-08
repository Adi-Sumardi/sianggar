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
            $query->whereYear('tanggal', $request->query('tahun'));
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

        $account = Account::findOrFail($validated['account_id']);
        $unit = isset($validated['unit_id']) ? Unit::find($validated['unit_id']) : $account->unit;

        $saldoAwal = 0.0;
        if ($account->unit_id !== null && $unit) {
            $saldoAwal = $this->ledgerService->getUnitDanaOpeningBalance($unit, $validated['tahun']);
        }

        $itemsQuery = JournalItem::query()
            ->with(['journalEntry'])
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($validated) {
                $q->where('status', \App\Enums\JournalEntryStatus::Posted->value)
                    ->whereYear('tanggal', $validated['tahun']);
            });

        if (isset($validated['unit_id'])) {
            $itemsQuery->where('unit_id', $validated['unit_id']);
        }

        $items = $itemsQuery->get()->sortBy(fn ($item) => $item->journalEntry->tanggal)->values();

        $runningBalance = $saldoAwal;
        $normalBalance = $account->saldo_normal;

        $mutations = $items->map(function (JournalItem $item) use (&$runningBalance, $normalBalance) {
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
        });

        return response()->json([
            'account' => new AccountResource($account),
            'unit' => $unit ? [
                'id' => $unit->id,
                'nama' => $unit->nama,
            ] : null,
            'tahun' => $validated['tahun'],
            'saldo_awal' => $saldoAwal,
            'mutasi' => $mutations,
            'saldo_akhir' => $runningBalance,
        ]);
    }
}
