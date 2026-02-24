<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Planning;

use App\Http\Controllers\Controller;
use App\Http\Requests\Planning\StoreStrategyRequest;
use App\Http\Resources\StrategyResource;
use App\Models\Strategy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StrategyController extends Controller
{
    /**
     * Display a paginated listing of strategies.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Strategy::withCount(['indikators', 'prokers']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $items = $query->orderBy('kode')->paginate($perPage);

        return StrategyResource::collection($items);
    }

    /**
     * Store a newly created strategy.
     */
    public function store(StoreStrategyRequest $request): JsonResponse
    {
        $strategy = Strategy::create($request->validated());

        return response()->json([
            'message' => 'Strategi berhasil dibuat.',
            'data' => new StrategyResource($strategy),
        ], 201);
    }

    /**
     * Display the specified strategy.
     */
    public function show(Strategy $strategy): JsonResponse
    {
        $strategy->load(['indikators', 'prokers']);
        $strategy->loadCount(['indikators', 'prokers']);

        return response()->json([
            'data' => new StrategyResource($strategy),
        ]);
    }

    /**
     * Update the specified strategy.
     */
    public function update(StoreStrategyRequest $request, Strategy $strategy): JsonResponse
    {
        $strategy->update($request->validated());

        return response()->json([
            'message' => 'Strategi berhasil diperbarui.',
            'data' => new StrategyResource($strategy),
        ]);
    }

    /**
     * Remove the specified strategy.
     */
    public function destroy(Strategy $strategy): JsonResponse
    {
        $strategy->delete();

        return response()->json([
            'message' => 'Strategi berhasil dihapus.',
        ]);
    }
}
