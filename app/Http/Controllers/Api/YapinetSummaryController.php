<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\ProposalStatus;
use App\Helpers\AcademicYear;
use App\Http\Controllers\Controller;
use App\Models\Apbs;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class YapinetSummaryController extends Controller
{
    /**
     * Status_proses values that count as "menunggu" (pending) from the
     * portal's point of view.
     *
     * @var list<string>
     */
    private const PENDING_STATUSES = [
        'draft',
        'submitted',
        'revision-required',
        'revised',
    ];

    /**
     * Status_proses values that count as "disetujui".
     *
     * @var list<string>
     */
    private const APPROVED_STATUSES = [
        'approved-level-1',
        'approved-level-2',
        'approved-level-3',
        'final-approved',
        'done',
        'paid',
    ];

    /**
     * How many days a pengajuan can sit in a pending status before the
     * overall summary is escalated to "critical".
     */
    private const OVERDUE_DAYS = 14;

    /**
     * Summary + detail payload polled by the external Yapinet portal.
     * Authenticated via the `yapinet.auth` static API key middleware —
     * not part of the Sanctum-protected v1 API.
     */
    public function summary(Request $request): JsonResponse
    {
        // Yapinet mengirim unit_id dari ruang UUID miliknya sendiri (tabel
        // `units` di sisi Yapinet), yang tidak berkorespondensi dengan id
        // integer auto-increment unit lokal Sianggar (Laz, Asrama, Sdm, dst).
        // Sampai ada pemetaan kode unit lintas-sistem, hanya terapkan filter
        // unit_id kalau nilainya benar-benar cocok dengan unit lokal —
        // kalau tidak (mis. dikirimi UUID Yapinet), abaikan filter dan
        // anggap "semua unit" alih-alih diam-diam mengembalikan hasil kosong.
        $rawUnitId = $request->query('unit_id');
        $unitId = ($rawUnitId !== null && Unit::where('id', $rawUnitId)->exists())
            ? (int) $rawUnitId
            : null;
        $tahun = $request->query('tahun') ?: AcademicYear::current();

        $baseQuery = fn () => PengajuanAnggaran::when(
            $unitId,
            fn ($q) => $q->where('unit_id', $unitId)
        );

        $pendingCount = (clone $baseQuery())->whereIn('status_proses', self::PENDING_STATUSES)->count();
        $approvedCount = (clone $baseQuery())->whereIn('status_proses', self::APPROVED_STATUSES)->count();
        $rejectedCount = (clone $baseQuery())->where('status_proses', ProposalStatus::Rejected->value)->count();

        $overdueCount = (clone $baseQuery())
            ->whereIn('status_proses', self::PENDING_STATUSES)
            ->where('created_at', '<=', now()->subDays(self::OVERDUE_DAYS))
            ->count();

        $status = match (true) {
            $overdueCount > 0 => 'critical',
            $pendingCount > 0 => 'warning',
            default => 'ok',
        };

        $headline = match (true) {
            $overdueCount > 0 => "{$overdueCount} pengajuan tertunda lebih dari " . self::OVERDUE_DAYS . ' hari',
            $pendingCount > 0 => "{$pendingCount} pengajuan menunggu persetujuan",
            default => 'Semua pengajuan sudah diproses',
        };

        // -------------------------------------------------------------------
        // APBS summary for the running academic year, plus a per-unit
        // breakdown (`by_unit`) so the Yapinet frontend's "Filter Unit"
        // dropdown can show that unit's own APBS/realisasi numbers instead
        // of always showing the all-unit aggregate. Computed for every real
        // Sianggar unit regardless of the (cross-system, currently
        // unreliable) $unitId query param — see note above.
        // -------------------------------------------------------------------
        $apbsRollup = function (string $tahunValue) {
            $list = Apbs::where('tahun', $tahunValue)->get();

            $total = (float) $list->sum('total_anggaran');
            $realisasi = (float) $list->sum('total_realisasi');
            $disahkan = $list->max('tanggal_pengesahan');

            return [
                'total_apbs' => $total,
                'disahkan_at' => $disahkan ? \Illuminate\Support\Carbon::parse($disahkan)->format('Y-m-d') : null,
                'unit_count' => $list->pluck('unit_id')->unique()->count(),
                'realisasi' => [
                    'percent' => $total > 0 ? (int) round(($realisasi / $total) * 100) : 0,
                    'terealisasi' => $realisasi,
                    'sisa' => $total - $realisasi,
                ],
                'by_unit' => $list->groupBy('unit_id')->map(function ($unitApbs, $groupUnitId) {
                    $unitTotal = (float) $unitApbs->sum('total_anggaran');
                    $unitRealisasi = (float) $unitApbs->sum('total_realisasi');
                    $unitDisahkan = $unitApbs->max('tanggal_pengesahan');

                    return [
                        'unit' => Unit::find($groupUnitId)?->nama ?? '-',
                        'total_apbs' => $unitTotal,
                        'disahkan_at' => $unitDisahkan ? \Illuminate\Support\Carbon::parse($unitDisahkan)->format('Y-m-d') : null,
                        'realisasi' => [
                            'percent' => $unitTotal > 0 ? (int) round(($unitRealisasi / $unitTotal) * 100) : 0,
                            'terealisasi' => $unitRealisasi,
                            'sisa' => $unitTotal - $unitRealisasi,
                        ],
                    ];
                })->values(),
            ];
        };

        $currentApbs = $apbsRollup($tahun);
        $totalApbs = $currentApbs['total_apbs'];
        $totalRealisasi = $currentApbs['realisasi']['terealisasi'];
        $percent = $currentApbs['realisasi']['percent'];

        // -------------------------------------------------------------------
        // Ringkasan APBS per tahun ajaran (untuk dropdown "Filter Tahun
        // Ajaran" di Yapinet — dikirim sekaligus di sini, bukan lewat query
        // terpisah per tahun, karena Yapinet hanya membaca snapshot cache
        // ini secara berkala, tidak fan-out live saat pengguna mengganti
        // pilihan tahun).
        // -------------------------------------------------------------------
        $tahunAjaran = Apbs::select('tahun')
            ->distinct()
            ->orderByDesc('tahun')
            ->limit(5)
            ->pluck('tahun')
            ->map(fn (string $tahunItem) => ['tahun' => $tahunItem, ...$apbsRollup($tahunItem)])
            ->values();

        // -------------------------------------------------------------------
        // Recent pengajuan (last 10, most recent first).
        // -------------------------------------------------------------------
        $recentPengajuan = (clone $baseQuery())
            ->with('unitRelation')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => $status,
            'headline' => $headline,
            'metrics' => [
                ['label' => 'Pengajuan Menunggu', 'value' => $pendingCount],
                ['label' => 'Pengajuan Disetujui', 'value' => $approvedCount],
                ['label' => 'Pengajuan Ditolak', 'value' => $rejectedCount],
            ],
            'details' => [
                'apbs' => [
                    'total_apbs' => $currentApbs['total_apbs'],
                    'disahkan_at' => $currentApbs['disahkan_at'],
                    'unit_count' => $currentApbs['unit_count'],
                    'by_unit' => $currentApbs['by_unit'],
                ],
                'realisasi' => [
                    'percent' => $percent,
                    'terealisasi' => $totalRealisasi,
                    'sisa' => $totalApbs - $totalRealisasi,
                ],
                'tahun_ajaran' => $tahunAjaran,
                'pengajuan' => $recentPengajuan->map(fn (PengajuanAnggaran $p) => [
                    'tanggal' => $p->created_at?->format('Y-m-d'),
                    'unit' => $p->unitRelation?->nama ?? $p->unit ?? '-',
                    'keterangan' => $p->nama_pengajuan ?: $p->perihal,
                    'nominal' => (float) $p->jumlah_pengajuan_total,
                    'status' => $this->mapStatus($p->status_proses),
                ])->values(),
            ],
            'updated_at' => now()->toIso8601String(),
            'detail_path' => null,
        ]);
    }

    /**
     * Map the internal ProposalStatus enum to the coarse-grained status
     * strings expected by the Yapinet portal contract.
     */
    private function mapStatus(?ProposalStatus $status): string
    {
        if ($status === null) {
            return 'Menunggu';
        }

        return match ($status) {
            ProposalStatus::Rejected => 'Ditolak',
            ProposalStatus::ApprovedLevel1,
            ProposalStatus::ApprovedLevel2,
            ProposalStatus::ApprovedLevel3,
            ProposalStatus::FinalApproved,
            ProposalStatus::Done,
            ProposalStatus::Paid => 'Disetujui',
            default => 'Menunggu',
        };
    }
}
