<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Planning;

use App\Exports\ProkerImportTemplate;
use App\Http\Controllers\Controller;
use App\Http\Requests\Planning\StoreProkerRequest;
use App\Http\Resources\ProkerResource;
use App\Imports\ProkerImport;
use App\Models\Proker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProkerController extends Controller
{
    /**
     * Display a paginated listing of program kerja.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Proker::with(['strategy', 'indikator', 'unit'])
            ->withCount('kegiatans');

        // Filter by user's unit if not admin/approver
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('strategy_id')) {
            $query->where('strategy_id', $request->query('strategy_id'));
        }

        if ($request->filled('indikator_id')) {
            $query->where('indikator_id', $request->query('indikator_id'));
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

        return ProkerResource::collection($items);
    }

    /**
     * Store a newly created program kerja.
     */
    public function store(StoreProkerRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $proker = Proker::create(array_merge($request->validated(), [
            'unit_id' => $user->unit_id,
        ]));
        $proker->load(['strategy', 'indikator', 'unit']);

        return response()->json([
            'message' => 'Program kerja berhasil dibuat.',
            'data' => new ProkerResource($proker),
        ], 201);
    }

    /**
     * Display the specified program kerja.
     */
    public function show(Proker $proker): JsonResponse
    {
        $proker->load(['strategy', 'indikator', 'kegiatans']);
        $proker->loadCount('kegiatans');

        return response()->json([
            'data' => new ProkerResource($proker),
        ]);
    }

    /**
     * Update the specified program kerja.
     */
    public function update(StoreProkerRequest $request, Proker $proker): JsonResponse
    {
        $proker->update($request->validated());
        $proker->load(['strategy', 'indikator']);

        return response()->json([
            'message' => 'Program kerja berhasil diperbarui.',
            'data' => new ProkerResource($proker),
        ]);
    }

    /**
     * Remove the specified program kerja.
     */
    public function destroy(Proker $proker): JsonResponse
    {
        $proker->delete();

        return response()->json([
            'message' => 'Program kerja berhasil dihapus.',
        ]);
    }

    /**
     * Download Excel template for importing program kerja.
     */
    public function importTemplate(): BinaryFileResponse
    {
        return Excel::download(new ProkerImportTemplate, 'template-import-proker.xlsx');
    }

    /**
     * Import program kerja from an Excel/CSV file.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:2048'],
        ]);

        try {
            /** @var \App\Models\User $user */
            $user = $request->user();

            $import = new ProkerImport($user->unit_id);
            Excel::import($import, $request->file('file'));

            $errorCount = count($import->getErrors());

            return response()->json([
                'message' => "Import selesai: {$import->getImportedCount()} berhasil" . ($errorCount ? ", {$errorCount} gagal." : '.'),
                'imported' => $import->getImportedCount(),
                'errors' => $import->getErrors(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal mengimpor file: ' . $e->getMessage(),
            ], 500);
        }
    }
}
