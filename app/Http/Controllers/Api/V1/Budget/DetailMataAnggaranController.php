<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Helpers\AcademicYear;
use App\Http\Controllers\Controller;
use App\Http\Resources\DetailMataAnggaranResource;
use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class DetailMataAnggaranController extends Controller
{
    /**
     * Display a listing of detail mata anggaran (standalone route).
     * Supports filtering by mata_anggaran_id and sub_mata_anggaran_id.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DetailMataAnggaran::with(['mataAnggaran', 'subMataAnggaran', 'unit', 'pkt']);

        // Filter by mata_anggaran_id if provided
        if ($request->filled('mata_anggaran_id')) {
            $query->where('mata_anggaran_id', $request->query('mata_anggaran_id'));
        }

        // Filter by sub_mata_anggaran_id if provided
        if ($request->filled('sub_mata_anggaran_id')) {
            $query->where('sub_mata_anggaran_id', $request->query('sub_mata_anggaran_id'));
        }

        // Filter by unit_id if provided
        if ($request->filled('unit_id')) {
            $unitId = (int) $request->query('unit_id');

            $query->where(function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);

                // Kasus khusus: PT YAPI Talent Academy belum punya anggaran
                // sendiri di APBS - dananya nempel di Bagian Umum > Rencana
                // Pembangunan dan Pengembangan Investasi Besar > Tambahan
                // Modal YTA (kode 695-11-17). Item itu perlu tetap tampil di
                // picker unit ini supaya mereka bisa mengajukan.
                $unit = Unit::find($unitId);
                if ($unit && mb_strtolower(trim($unit->nama)) === 'pt yapi talent academy') {
                    $q->orWhere('kode', '695-11-17');
                }
            });
        }

        // Filter by tahun if provided
        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderBy('kode')->paginate($perPage);

        return DetailMataAnggaranResource::collection($items);
    }

    /**
     * Store a newly created detail mata anggaran (standalone route).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mata_anggaran_id' => ['required', 'integer', Rule::exists('mata_anggarans', 'id')],
            'sub_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('sub_mata_anggarans', 'id')],
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'pkt_id' => ['nullable', 'integer', Rule::exists('pkts', 'id')],
            'kode' => ['required', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'tahun' => ['nullable', 'string', 'max:9'],
            'volume' => ['nullable', 'numeric', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'jumlah' => ['nullable', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        // Auto-fill tahun from mata_anggaran if not provided
        if (empty($validated['tahun'])) {
            $mataAnggaran = MataAnggaran::find($validated['mata_anggaran_id']);
            $validated['tahun'] = $mataAnggaran?->tahun ?? AcademicYear::current();
        }

        // Inisialisasi saldo anggaran dari jumlah agar detail langsung dapat
        // dipakai untuk pengajuan (anggaran_awal & balance = jumlah, belum terpakai).
        $jumlah = (float) ($validated['jumlah'] ?? 0);
        $validated['anggaran_awal'] = $jumlah;
        $validated['balance'] = $jumlah;
        $validated['saldo_dipakai'] = 0;

        $detail = DetailMataAnggaran::create($validated);
        $detail->load(['mataAnggaran', 'subMataAnggaran', 'unit', 'pkt']);

        return response()->json([
            'message' => 'Detail mata anggaran berhasil dibuat.',
            'data' => new DetailMataAnggaranResource($detail),
        ], 201);
    }

    /**
     * Display the specified detail mata anggaran (standalone route).
     */
    public function show(DetailMataAnggaran $detailMataAnggaran): JsonResponse
    {
        $detailMataAnggaran->load(['mataAnggaran', 'subMataAnggaran', 'unit', 'pkt']);

        return response()->json([
            'data' => new DetailMataAnggaranResource($detailMataAnggaran),
        ]);
    }

    /**
     * Update the specified detail mata anggaran (standalone route).
     */
    public function update(Request $request, DetailMataAnggaran $detailMataAnggaran): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['sometimes', 'required', 'integer', Rule::exists('units', 'id')],
            'pkt_id' => ['nullable', 'integer', Rule::exists('pkts', 'id')],
            'kode' => ['sometimes', 'required', 'string', 'max:50'],
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'volume' => ['nullable', 'numeric', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'jumlah' => ['nullable', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $detailMataAnggaran->update($validated);

        // Bila jumlah diubah, selaraskan anggaran_awal & balance (pertahankan pemakaian).
        if (array_key_exists('jumlah', $validated)) {
            $jumlah = (float) ($validated['jumlah'] ?? 0);
            $saldoDipakai = (float) ($detailMataAnggaran->saldo_dipakai ?? 0);
            $detailMataAnggaran->update([
                'anggaran_awal' => $jumlah,
                'balance' => max(0, $jumlah - $saldoDipakai),
            ]);
        }

        $detailMataAnggaran->load(['mataAnggaran', 'subMataAnggaran', 'unit', 'pkt']);

        return response()->json([
            'message' => 'Detail mata anggaran berhasil diperbarui.',
            'data' => new DetailMataAnggaranResource($detailMataAnggaran),
        ]);
    }

    /**
     * Remove the specified detail mata anggaran (standalone route).
     * Checks for dependencies before deletion.
     */
    public function destroy(DetailMataAnggaran $detailMataAnggaran): JsonResponse
    {
        // Check if this detail has any pengajuans
        $pengajuanCount = $detailMataAnggaran->detailPengajuans()->count();
        if ($pengajuanCount > 0) {
            return response()->json([
                'message' => "Detail mata anggaran tidak dapat dihapus karena memiliki {$pengajuanCount} pengajuan anggaran terkait.",
                'error' => 'has_dependencies',
                'dependencies' => [
                    'detail_pengajuans' => $pengajuanCount,
                ],
            ], 422);
        }

        $detailMataAnggaran->delete();

        return response()->json([
            'message' => 'Detail mata anggaran berhasil dihapus.',
        ]);
    }

    /**
     * Check budget sufficiency for multiple items.
     * Returns detailed information about each item's budget status.
     */
    public function checkBudget(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.detail_mata_anggaran_id' => ['required', 'integer', Rule::exists('detail_mata_anggarans', 'id')],
            'items.*.jumlah' => ['required', 'numeric', 'min:0'],
        ]);

        $results = [];
        $allSufficient = true;

        foreach ($validated['items'] as $item) {
            $detail = DetailMataAnggaran::find($item['detail_mata_anggaran_id']);
            $balance = (float) ($detail->balance ?? 0);
            $jumlah = (float) $item['jumlah'];
            $isSufficient = $balance >= $jumlah;

            if (! $isSufficient) {
                $allSufficient = false;
            }

            $results[] = [
                'detail_mata_anggaran_id' => $detail->id,
                'kode' => $detail->kode,
                'nama' => $detail->nama,
                'anggaran_awal' => (float) ($detail->anggaran_awal ?? 0),
                'saldo_dipakai' => (float) ($detail->saldo_dipakai ?? 0),
                'saldo_tersedia' => $balance,
                'jumlah_diminta' => $jumlah,
                'is_sufficient' => $isSufficient,
                'kekurangan' => $isSufficient ? 0 : ($jumlah - $balance),
            ];
        }

        return response()->json([
            'all_sufficient' => $allSufficient,
            'items' => $results,
        ]);
    }
}
