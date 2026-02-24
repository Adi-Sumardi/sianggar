<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Planning;

use App\Http\Controllers\Controller;
use App\Http\Requests\Planning\StoreIndicatorRequest;
use App\Http\Resources\IndicatorResource;
use App\Models\Indikator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IndicatorController extends Controller
{
    /**
     * Display a paginated listing of indicators.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Indikator::with('strategy')
            ->withCount('prokers');

        if ($request->filled('strategy_id')) {
            $query->where('strategy_id', $request->query('strategy_id'));
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

        return IndicatorResource::collection($items);
    }

    /**
     * Store a newly created indicator.
     */
    public function store(StoreIndicatorRequest $request): JsonResponse
    {
        $indikator = Indikator::create($request->validated());
        $indikator->load('strategy');

        return response()->json([
            'message' => 'Indikator berhasil dibuat.',
            'data' => new IndicatorResource($indikator),
        ], 201);
    }

    /**
     * Display the specified indicator.
     */
    public function show(Indikator $indicator): JsonResponse
    {
        $indicator->load(['strategy', 'prokers']);
        $indicator->loadCount('prokers');

        return response()->json([
            'data' => new IndicatorResource($indicator),
        ]);
    }

    /**
     * Update the specified indicator.
     */
    public function update(StoreIndicatorRequest $request, Indikator $indicator): JsonResponse
    {
        $indicator->update($request->validated());
        $indicator->load('strategy');

        return response()->json([
            'message' => 'Indikator berhasil diperbarui.',
            'data' => new IndicatorResource($indicator),
        ]);
    }

    /**
     * Remove the specified indicator.
     */
    public function destroy(Indikator $indicator): JsonResponse
    {
        $indicator->delete();

        return response()->json([
            'message' => 'Indikator berhasil dihapus.',
        ]);
    }
}
