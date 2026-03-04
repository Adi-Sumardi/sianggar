<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Planning;

use App\Exports\KegiatanImportTemplate;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Imports\KegiatanImport;
use App\Models\Kegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ActivityController extends Controller
{
    /**
     * Display a paginated listing of kegiatan (activities).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Kegiatan::with(['strategy', 'indikator', 'proker', 'unit'])
            ->withCount('pkts');

        // Filter by user's unit if not admin/approver
        if ($user->role->shouldFilterByOwnData() && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->filled('unit_id')) {
            $query->where('unit_id', $request->query('unit_id'));
        }

        if ($request->filled('strategy_id')) {
            $query->where('strategy_id', $request->query('strategy_id'));
        }

        if ($request->filled('proker_id')) {
            $query->where('proker_id', $request->query('proker_id'));
        }

        if ($request->filled('jenis_kegiatan')) {
            $query->where('jenis_kegiatan', $request->query('jenis_kegiatan'));
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

        return ActivityResource::collection($items);
    }

    /**
     * Store a newly created kegiatan.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'strategy_id' => ['required', 'integer', Rule::exists('strategies', 'id')],
            'indikator_id' => ['required', 'integer', Rule::exists('indikators', 'id')],
            'proker_id' => ['required', 'integer', Rule::exists('prokers', 'id')],
            'kode' => ['required', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis_kegiatan' => ['sometimes', 'string', Rule::in(['unggulan', 'non-unggulan'])],
        ]);

        $kegiatan = Kegiatan::create(array_merge($validated, [
            'unit_id' => $user->unit_id,
        ]));
        $kegiatan->load(['strategy', 'indikator', 'proker', 'unit']);

        return response()->json([
            'message' => 'Kegiatan berhasil dibuat.',
            'data' => new ActivityResource($kegiatan),
        ], 201);
    }

    /**
     * Display the specified kegiatan.
     */
    public function show(Kegiatan $activity): JsonResponse
    {
        $activity->load(['strategy', 'indikator', 'proker', 'pkts']);
        $activity->loadCount('pkts');

        return response()->json([
            'data' => new ActivityResource($activity),
        ]);
    }

    /**
     * Update the specified kegiatan.
     */
    public function update(Request $request, Kegiatan $activity): JsonResponse
    {
        $validated = $request->validate([
            'strategy_id' => ['sometimes', 'required', 'integer', Rule::exists('strategies', 'id')],
            'indikator_id' => ['sometimes', 'required', 'integer', Rule::exists('indikators', 'id')],
            'proker_id' => ['sometimes', 'required', 'integer', Rule::exists('prokers', 'id')],
            'kode' => ['sometimes', 'required', 'string', 'max:50'],
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'jenis_kegiatan' => ['sometimes', 'string', Rule::in(['unggulan', 'non-unggulan'])],
        ]);

        $activity->update($validated);
        $activity->load(['strategy', 'indikator', 'proker']);

        return response()->json([
            'message' => 'Kegiatan berhasil diperbarui.',
            'data' => new ActivityResource($activity),
        ]);
    }

    /**
     * Remove the specified kegiatan.
     */
    public function destroy(Kegiatan $activity): JsonResponse
    {
        $activity->delete();

        return response()->json([
            'message' => 'Kegiatan berhasil dihapus.',
        ]);
    }

    /**
     * Download Excel template for importing kegiatan.
     */
    public function importTemplate(): BinaryFileResponse
    {
        return Excel::download(new KegiatanImportTemplate, 'template-import-kegiatan.xlsx');
    }

    /**
     * Import kegiatan from an Excel/CSV file.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:2048'],
        ]);

        try {
            /** @var \App\Models\User $user */
            $user = $request->user();

            $delimiter = $this->detectCsvDelimiter($request->file('file'));
            $import = new KegiatanImport($user->unit_id, $delimiter);
            Excel::import($import, $request->file('file'));

            $errorCount = count($import->getErrors());

            return response()->json([
                'message' => "Import selesai: {$import->getImportedCount()} berhasil" . ($errorCount ? ", {$errorCount} gagal." : '.'),
                'imported' => $import->getImportedCount(),
                'errors' => $import->getErrors(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengimpor file. Silakan hubungi administrator.',
            ], 500);
        }
    }

    protected function detectCsvDelimiter(\Illuminate\Http\UploadedFile $file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, ['csv', 'txt'], true)) {
            return ',';
        }

        $firstLine = fgets(fopen($file->getRealPath(), 'r'));

        return ($firstLine && substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';
    }
}
