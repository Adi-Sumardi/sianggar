<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Apbs;
use App\Models\Approval;
use App\Models\Lpj;
use App\Models\Penerimaan;
use App\Models\PengajuanAnggaran;
use App\Models\Rapbs;
use App\Models\RealisasiAnggaran;
use App\Models\Unit;
use App\Models\User;
use App\Enums\ApprovalStatus;
use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ProposalStatus;
use App\Enums\RapbsStatus;
use App\Helpers\AcademicYear;
use App\Services\ApprovalService;
use App\Services\LpjApprovalService;
use App\Services\RapbsApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvalService,
        private readonly LpjApprovalService $lpjApprovalService,
        private readonly RapbsApprovalService $rapbsApprovalService,
    ) {}

    /**
     * Return role-aware dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $dashboardType = $user->role->dashboardType();

        // Admin can filter by unit_id
        $unitId = $request->query('unit_id') ? (int) $request->query('unit_id') : null;

        $stats = match ($dashboardType) {
            'admin' => $this->adminStats($unitId),
            'unit' => $this->unitStats($user),
            'finance' => $this->financeStats($unitId),
            'kasir' => $this->kasirStats(),
            'payment' => $this->paymentDashboardStats(),
            'leadership' => $this->approverStats($user, $unitId),
            default => $this->approverStats($user, $unitId),
        };

        return response()->json([
            'data' => [
                'type' => $dashboardType,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Return chart data (budget vs realization per unit).
     */
    public function charts(Request $request): JsonResponse
    {
        $tahun = $request->query('tahun', AcademicYear::current());
        $unitId = $request->query('unit_id') ? (int) $request->query('unit_id') : null;

        $unitsQuery = Unit::with(['apbs' => function ($q) use ($tahun) {
            $q->where('tahun', $tahun);
        }]);

        if ($unitId) {
            $unitsQuery->where('id', $unitId);
        }

        $units = $unitsQuery->get();

        $chartData = $units->map(function (Unit $unit) {
            $apbs = $unit->apbs->first();

            return [
                'unit' => $unit->nama,
                'anggaran' => $apbs?->total_anggaran ?? 0,
                'realisasi' => $apbs?->total_realisasi ?? 0,
                'sisa' => $apbs?->sisa_anggaran ?? 0,
            ];
        });

        return response()->json([
            'data' => $chartData,
        ]);
    }

    /**
     * Return monthly chart data (pengajuan vs realisasi per month) for a specific unit.
     */
    public function monthlyCharts(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tahun = $request->query('tahun', AcademicYear::current());
        $unitId = $request->query('unit_id')
            ? (int) $request->query('unit_id')
            : $user->unit_id;

        if (! $unitId) {
            return response()->json(['data' => []]);
        }

        $months = [
            7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt',
            11 => 'Nov', 12 => 'Des', 1 => 'Jan', 2 => 'Feb',
            3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        ];

        $startYear = AcademicYear::startYear($tahun);
        $endYear = AcademicYear::endYear($tahun);

        $chartData = [];

        foreach ($months as $monthNum => $monthLabel) {
            $year = $monthNum >= 7 ? $startYear : $endYear;

            // Sum pengajuan amounts for this month (approved/final-approved/done/paid)
            $pengajuan = PengajuanAnggaran::where('unit_id', $unitId)
                ->where('tahun', $tahun)
                ->whereIn('status_proses', [
                    'approved-level-1', 'approved-level-2', 'approved-level-3',
                    'final-approved', 'done', 'paid',
                ])
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $monthNum)
                ->sum('jumlah_pengajuan_total');

            // Sum realisasi for this month
            $realisasi = RealisasiAnggaran::where('unit_id', $unitId)
                ->where('tahun', $tahun)
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $monthNum)
                ->sum('jumlah_realisasi');

            $chartData[] = [
                'bulan' => $monthLabel . ' ' . $year,
                'pengajuan' => (float) $pengajuan,
                'realisasi' => (float) $realisasi,
            ];
        }

        return response()->json([
            'data' => $chartData,
        ]);
    }

    /**
     * Return recent pengajuan list.
     */
    public function recentPengajuan(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $dashboardType = $user->role->dashboardType();
        $unitId = $request->query('unit_id') ? (int) $request->query('unit_id') : null;
        $limit = $request->query('limit', 10);

        $query = PengajuanAnggaran::with(['unitRelation', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        // Filter based on dashboard type
        if ($dashboardType === 'kasir') {
            // Kasir sees items with voucher pending print
            $query->whereNotNull('no_voucher')
                ->where(function ($q) {
                    $q->whereNull('print_status')->orWhere('print_status', '!=', 'printed');
                });
        } elseif ($dashboardType === 'payment') {
            // Payment sees printed vouchers awaiting payment
            $query->whereNotNull('no_voucher')
                ->where('print_status', 'printed')
                ->whereNull('paid_at');
        } elseif ($dashboardType === 'unit' && $user->unit_id !== null) {
            $query->where('unit_id', $user->unit_id);
        } elseif ($unitId) {
            // Admin/Leadership can filter by unit_id
            $query->where('unit_id', $unitId);
        }

        $pengajuans = $query->get();
        $includeVoucher = in_array($dashboardType, ['kasir', 'payment']);

        return response()->json([
            'data' => $pengajuans->map(function (PengajuanAnggaran $p) use ($includeVoucher) {
                $item = [
                    'id' => $p->id,
                    'nomor' => $p->nomor_pengajuan ?? 'PA/' . $p->tahun . '/' . str_pad((string) $p->id, 3, '0', STR_PAD_LEFT),
                    'perihal' => $p->perihal,
                    'unit' => $p->unitRelation?->nama ?? $p->unit ?? '-',
                    'total' => $p->jumlah_pengajuan_total,
                    'status' => $p->status_proses,
                    'tanggal' => $p->created_at?->format('Y-m-d'),
                ];

                if ($includeVoucher) {
                    $item['no_voucher'] = $p->no_voucher;
                }

                return $item;
            }),
        ]);
    }

    /**
     * Get status distribution for pie chart.
     */
    public function statusDistribution(Request $request): JsonResponse
    {
        $unitId = $request->query('unit_id') ? (int) $request->query('unit_id') : null;

        $statuses = ['draft', 'submitted', 'approved-level-1', 'approved-level-2', 'final-approved', 'done', 'paid', 'revision-required', 'rejected'];
        $statusLabels = [
            'draft' => 'Draft',
            'submitted' => 'Diajukan',
            'approved-level-1' => 'Level 1',
            'approved-level-2' => 'Level 2',
            'final-approved' => 'Final',
            'done' => 'Selesai',
            'paid' => 'Dibayar',
            'revision-required' => 'Revisi',
            'rejected' => 'Ditolak',
        ];
        $statusColors = [
            'draft' => '#94a3b8',
            'submitted' => '#3b82f6',
            'approved-level-1' => '#06b6d4',
            'approved-level-2' => '#8b5cf6',
            'final-approved' => '#22c55e',
            'done' => '#10b981',
            'paid' => '#059669',
            'revision-required' => '#f97316',
            'rejected' => '#ef4444',
        ];

        $data = [];
        foreach ($statuses as $status) {
            $query = PengajuanAnggaran::where('status_proses', $status);
            if ($unitId) {
                $query->where('unit_id', $unitId);
            }
            $count = $query->count();
            if ($count > 0) {
                $data[] = [
                    'name' => $statusLabels[$status] ?? $status,
                    'value' => $count,
                    'color' => $statusColors[$status] ?? '#64748b',
                ];
            }
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Admin dashboard statistics.
     * When unit_id is provided, stats are filtered for that specific unit.
     */
    private function adminStats(?int $unitId = null): array
    {
        if ($unitId) {
            $unit = Unit::find($unitId);
            if (!$unit) {
                return [
                    'total_users' => 0,
                    'total_pengajuan' => 0,
                    'total_lpj' => 0,
                    'total_anggaran' => 0,
                    'total_units' => 0,
                ];
            }

            $tahun = AcademicYear::current();
            $apbs = Apbs::where('unit_id', $unitId)->where('tahun', $tahun)->first();

            return [
                'total_users' => User::where('unit_id', $unitId)->count(),
                'total_pengajuan' => PengajuanAnggaran::where('unit_id', $unitId)->count(),
                'total_lpj' => Lpj::whereHas('pengajuanAnggaran', function ($q) use ($unitId) {
                    $q->where('unit_id', $unitId);
                })->count(),
                'total_anggaran' => $apbs?->total_anggaran ?? 0,
                'saldo_anggaran' => $apbs?->sisa_anggaran ?? 0,
                'total_realisasi' => $apbs?->total_realisasi ?? 0,
                'total_units' => 1,
                'unit_nama' => $unit->nama,
            ];
        }

        return [
            'total_users' => User::count(),
            'total_pengajuan' => PengajuanAnggaran::count(),
            'total_lpj' => Lpj::count(),
            'total_anggaran' => Apbs::where('tahun', AcademicYear::current())->sum('total_anggaran'),
            'total_units' => Unit::count(),
        ];
    }

    /**
     * Unit dashboard statistics.
     */
    private function unitStats(User $user): array
    {
        $unitId = $user->unit_id;

        if ($unitId === null) {
            return [
                'saldo_anggaran' => 0,
                'total_anggaran' => 0,
                'total_realisasi' => 0,
                'pending_pengajuan' => 0,
                'total_pengajuan' => 0,
            ];
        }

        $apbs = Apbs::where('unit_id', $unitId)
            ->where('tahun', AcademicYear::current())
            ->first();

        return [
            'saldo_anggaran' => $apbs?->sisa_anggaran ?? 0,
            'total_anggaran' => $apbs?->total_anggaran ?? 0,
            'total_realisasi' => $apbs?->total_realisasi ?? 0,
            'pending_pengajuan' => PengajuanAnggaran::where('unit_id', $unitId)
                ->whereIn('status_proses', ['draft', 'submitted', 'in-review'])
                ->count(),
            'total_pengajuan' => PengajuanAnggaran::where('unit_id', $unitId)->count(),
        ];
    }

    /**
     * Finance dashboard statistics.
     */
    private function financeStats(?int $unitId = null): array
    {
        $tahun = AcademicYear::current();

        $penerimaanQuery = Penerimaan::where('tahun', $tahun);
        $realisasiQuery = RealisasiAnggaran::where('tahun', $tahun);
        $apbsQuery = Apbs::where('tahun', $tahun);
        $pendingPaymentQuery = PengajuanAnggaran::where('status_proses', 'approved')
            ->where('status_payment', 'unpaid');

        if ($unitId) {
            $penerimaanQuery->where('unit_id', $unitId);
            $realisasiQuery->where('unit_id', $unitId);
            $apbsQuery->where('unit_id', $unitId);
            $pendingPaymentQuery->where('unit_id', $unitId);
        }

        return [
            'total_penerimaan' => $penerimaanQuery->sum('jumlah'),
            'total_pengeluaran' => $realisasiQuery->sum('jumlah_realisasi'),
            'total_anggaran' => $apbsQuery->sum('total_anggaran'),
            'pending_payment' => $pendingPaymentQuery->count(),
        ];
    }

    /**
     * Approver / leadership dashboard statistics.
     */
    private function approverStats(User $user, ?int $unitId = null): array
    {
        $pendingCount = $this->approvalService->countPendingForRole($user, $unitId);

        $totalPengajuanQuery = PengajuanAnggaran::query();
        $totalApprovedQuery = PengajuanAnggaran::where('status_proses', 'approved');

        if ($unitId) {
            $totalPengajuanQuery->where('unit_id', $unitId);
            $totalApprovedQuery->where('unit_id', $unitId);
        }

        return [
            'pending_approval' => $pendingCount,
            'total_pengajuan' => $totalPengajuanQuery->count(),
            'total_approved' => $totalApprovedQuery->count(),
        ];
    }

    /**
     * Kasir dashboard statistics (voucher printing).
     */
    private function kasirStats(): array
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        return [
            'menunggu_cetak' => PengajuanAnggaran::whereNotNull('no_voucher')
                ->where(function ($q) {
                    $q->whereNull('print_status')->orWhere('print_status', '!=', 'printed');
                })
                ->count(),
            'dicetak_hari_ini' => PengajuanAnggaran::where('print_status', 'printed')
                ->where('updated_at', '>=', $today)
                ->count(),
            'total_cetak_bulan_ini' => PengajuanAnggaran::where('print_status', 'printed')
                ->where('updated_at', '>=', $monthStart)
                ->count(),
        ];
    }

    /**
     * Payment dashboard statistics.
     */
    private function paymentDashboardStats(): array
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        return [
            'menunggu_proses' => PengajuanAnggaran::whereNotNull('no_voucher')
                ->where('print_status', 'printed')
                ->whereNull('paid_at')
                ->count(),
            'diproses_hari_ini' => PengajuanAnggaran::whereNotNull('paid_at')
                ->where('paid_at', '>=', $today)
                ->count(),
            'total_proses_bulan_ini' => PengajuanAnggaran::whereNotNull('paid_at')
                ->where('paid_at', '>=', $monthStart)
                ->count(),
        ];
    }

    /**
     * Return reminder/notification stats for the login modal.
     * Covers both approver roles and unit/substansi roles.
     */
    public function reminderStats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $role = $user->role;
        $isApprover = $role->isApprover();
        $filterByOwn = $role->shouldFilterByOwnData();
        $unitId = $user->unit_id;

        $data = [];

        // -----------------------------------------------------------------
        // Approver: pending items that need their approval
        // -----------------------------------------------------------------
        if ($isApprover || $role === \App\Enums\UserRole::Admin) {
            // Pending Pengajuan approvals
            $data['pending_pengajuan_approval'] = $this->approvalService->countPendingForRole($user);

            // Pending LPJ approvals
            $lpjStages = collect(LpjApprovalStage::cases())
                ->filter(fn (LpjApprovalStage $s) => $s->requiredRole() === $role)
                ->pluck('value')
                ->toArray();

            if ($role === \App\Enums\UserRole::Admin) {
                $data['pending_lpj_approval'] = Approval::where('approvable_type', Lpj::class)
                    ->where('status', ApprovalStatus::Pending->value)
                    ->whereHas('approvable')
                    ->count();
            } elseif (! empty($lpjStages)) {
                $data['pending_lpj_approval'] = Approval::where('approvable_type', Lpj::class)
                    ->whereIn('stage', $lpjStages)
                    ->where('status', ApprovalStatus::Pending->value)
                    ->whereHas('approvable', fn ($q) => $q->whereIn('current_approval_stage', $lpjStages))
                    ->count();
            } else {
                $data['pending_lpj_approval'] = 0;
            }

            // Pending RAPBS approvals
            $data['pending_rapbs_approval'] = $this->rapbsApprovalService
                ->getPendingForUser($user)
                ->count();
        }

        // -----------------------------------------------------------------
        // Unit / Substansi: items needing revision or rejected
        // -----------------------------------------------------------------
        if ($filterByOwn) {
            // Pengajuan perlu revisi
            $revisedPengajuanQuery = PengajuanAnggaran::where('status_proses', ProposalStatus::RevisionRequired->value);
            if ($unitId !== null) {
                $revisedPengajuanQuery->where('unit_id', $unitId);
            }
            $data['revised_pengajuan_count'] = $revisedPengajuanQuery->count();

            // LPJ perlu revisi
            $revisedLpjQuery = Lpj::where('proses', LpjStatus::Revised->value);
            if ($unitId !== null) {
                $revisedLpjQuery->whereHas('pengajuanAnggaran', fn ($q) => $q->where('unit_id', $unitId));
            }
            $data['revised_lpj_count'] = $revisedLpjQuery->count();

            // RAPBS ditolak (perlu revisi / resubmit)
            $revisedRapbsQuery = Rapbs::where('status', RapbsStatus::Rejected);
            if ($unitId !== null) {
                $revisedRapbsQuery->where('unit_id', $unitId);
            }
            $data['revised_rapbs_count'] = $revisedRapbsQuery->count();

            // Pengajuan ditolak
            $rejectedPengajuanQuery = PengajuanAnggaran::where('status_proses', ProposalStatus::Rejected->value);
            if ($unitId !== null) {
                $rejectedPengajuanQuery->where('unit_id', $unitId);
            }
            $data['rejected_pengajuan_count'] = $rejectedPengajuanQuery->count();

            // LPJ ditolak
            $rejectedLpjQuery = Lpj::where('proses', LpjStatus::Rejected->value);
            if ($unitId !== null) {
                $rejectedLpjQuery->whereHas('pengajuanAnggaran', fn ($q) => $q->where('unit_id', $unitId));
            }
            $data['rejected_lpj_count'] = $rejectedLpjQuery->count();

            // RAPBS ditolak (same as revised for RAPBS — rejected status)
            $data['rejected_rapbs_count'] = $data['revised_rapbs_count'];
        }

        return response()->json(['data' => $data]);
    }
}
