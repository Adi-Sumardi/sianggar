<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Models\JenisMataAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JenisMataAnggaranController extends Controller
{
    /**
     * Display a listing of jenis mata anggaran.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JenisMataAnggaran::query();

        // Only show active by default
        if (!$request->boolean('include_inactive', false)) {
            $query->active();
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                    ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $jenisList = $query->orderBy('kode')->get();

        return response()->json([
            'data' => $jenisList,
        ]);
    }

    /**
     * Store a newly created jenis mata anggaran.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:jenis_mata_anggarans,kode'],
            'nama' => ['required', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $jenis = JenisMataAnggaran::create($validated);

        return response()->json([
            'message' => 'Jenis mata anggaran berhasil ditambahkan.',
            'data' => $jenis,
        ], 201);
    }

    /**
     * Display the specified jenis mata anggaran.
     */
    public function show(JenisMataAnggaran $jenisMataAnggaran): JsonResponse
    {
        return response()->json([
            'data' => $jenisMataAnggaran,
        ]);
    }

    /**
     * Update the specified jenis mata anggaran.
     */
    public function update(Request $request, JenisMataAnggaran $jenisMataAnggaran): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['sometimes', 'required', 'string', 'max:50', 'unique:jenis_mata_anggarans,kode,' . $jenisMataAnggaran->id],
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $jenisMataAnggaran->update($validated);

        return response()->json([
            'message' => 'Jenis mata anggaran berhasil diperbarui.',
            'data' => $jenisMataAnggaran,
        ]);
    }

    /**
     * Remove the specified jenis mata anggaran.
     */
    public function destroy(JenisMataAnggaran $jenisMataAnggaran): JsonResponse
    {
        // Check if any mata anggaran uses this jenis
        if ($jenisMataAnggaran->mataAnggarans()->exists()) {
            return response()->json([
                'message' => 'Tidak dapat menghapus jenis yang masih digunakan oleh mata anggaran.',
            ], 422);
        }

        $jenisMataAnggaran->delete();

        return response()->json([
            'message' => 'Jenis mata anggaran berhasil dihapus.',
        ]);
    }
}
