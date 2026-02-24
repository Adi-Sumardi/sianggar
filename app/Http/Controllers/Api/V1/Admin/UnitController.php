<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UnitController extends Controller
{
    /**
     * Return a simple list of all units (for dropdowns/filters).
     * Accessible to all authenticated users.
     */
    public function list(): JsonResponse
    {
        $units = Unit::orderBy('nama')->get(['id', 'kode', 'nama']);

        return response()->json([
            'data' => $units->map(fn (Unit $unit) => [
                'id' => $unit->id,
                'kode' => $unit->kode,
                'nama' => $unit->nama,
            ]),
        ]);
    }

    /**
     * Display a paginated listing of units.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Unit::withCount('users', 'mataAnggarans');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $units = $query->orderBy('nama')->paginate($perPage);

        return UnitResource::collection($units);
    }

    /**
     * Store a newly created unit.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:units,kode'],
            'nama' => ['required', 'string', 'max:255'],
        ]);

        $unit = Unit::create($validated);

        return response()->json([
            'message' => 'Unit berhasil dibuat.',
            'data' => new UnitResource($unit),
        ], 201);
    }

    /**
     * Display the specified unit.
     */
    public function show(Unit $unit): JsonResponse
    {
        $unit->loadCount('users', 'mataAnggarans');

        return response()->json([
            'data' => new UnitResource($unit),
        ]);
    }

    /**
     * Update the specified unit.
     */
    public function update(Request $request, Unit $unit): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['sometimes', 'required', 'string', 'max:50', 'unique:units,kode,' . $unit->id],
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $unit->update($validated);

        return response()->json([
            'message' => 'Unit berhasil diperbarui.',
            'data' => new UnitResource($unit),
        ]);
    }

    /**
     * Remove the specified unit.
     */
    public function destroy(Unit $unit): JsonResponse
    {
        $unit->delete();

        return response()->json([
            'message' => 'Unit berhasil dihapus.',
        ]);
    }
}
