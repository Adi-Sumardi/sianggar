import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BarChart3, Building2, Wallet, Loader2, ChevronDown, ChevronRight, Send, Eye, FileCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchFilter } from '@/components/common/SearchFilter';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { useRapbsList as useRapbsAggregated, useSubMataAnggarans, useDetailMataAnggarans, useUpdateBudgetComparison } from '@/hooks/useBudget';
import { useRapbsList as useRapbsRecords, useSubmitRapbs } from '@/hooks/useRapbsApproval';
import { useAuth } from '@/hooks/useAuth';
import { getAcademicYearOptions } from '@/stores/authStore';
import type { RapbsUnitData } from '@/services/budgetService';
import type { Rapbs } from '@/types/models';
import { UserRole } from '@/types/enums';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatAcademicYear(year: string): { previous: string; current: string } {
    // Handle academic year format (e.g., "2025/2026")
    if (year.includes('/')) {
        const [startYear] = year.split('/').map(Number);
        return {
            previous: `${startYear - 1}/${startYear}`,
            current: year,
        };
    }
    // Legacy format: single year (e.g., "2026")
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    return {
        previous: `${yearNum - 1}/${yearNum}`,
        current: `${yearNum}/${yearNum + 1}`,
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RapbsList() {
    const defaultTahun = '2026/2027';
    const [filterValues, setFilterValues] = useState<Record<string, string>>({ tahun: defaultTahun });
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedMa, setExpandedMa] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'records' | 'aggregated'>('records');

    // Get current user and check if admin
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;

    // Memoize params to prevent unnecessary refetches
    const recordsParams = useMemo(() => ({
        tahun: filterValues.tahun || undefined,
        status: filterValues.status || undefined,
        per_page: 1000,
    }), [filterValues.tahun, filterValues.status]);

    const aggregatedParams = useMemo(() => ({
        tahun: filterValues.tahun || undefined,
    }), [filterValues.tahun]);

    // Fetch individual RAPBS records (for status/submit workflow)
    const {
        data: rapbsRecordsData,
        isLoading: isLoadingRecords,
        isError: isErrorRecords,
        error: errorRecords
    } = useRapbsRecords(recordsParams);

    // Fetch aggregated data (for budget overview)
    const { data: rapbsData, isLoading, isError, error } = useRapbsAggregated(aggregatedParams);

    // Submit mutation
    const submitRapbs = useSubmitRapbs();

    // Budget comparison mutation
    const updateBudgetComparison = useUpdateBudgetComparison();

    const handleUpdateBudgetComparison = useCallback(
        (mataAnggaranId: number, field: 'apbs_tahun_lalu' | 'asumsi_realisasi', value: number) => {
            updateBudgetComparison.mutate(
                { mataAnggaranId, dto: { [field]: value } },
                {
                    onSuccess: () => {
                        toast.success('Data perbandingan berhasil diperbarui');
                    },
                    onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Gagal memperbarui data');
                    },
                }
            );
        },
        [updateBudgetComparison]
    );

    const handleSubmitRapbs = (rapbs: Rapbs) => {
        if (!rapbs.can_submit) {
            toast.error('RAPBS tidak dapat disubmit');
            return;
        }
        if (rapbs.is_over_budget) {
            toast.error('Total Anggaran melebihi Total Plafon. Sesuaikan anggaran terlebih dahulu.');
            return;
        }
        submitRapbs.mutate(rapbs.id, {
            onSuccess: () => {
                toast.success('RAPBS berhasil disubmit untuk approval');
            },
            onError: (error) => {
                toast.error(error instanceof Error ? error.message : 'Gagal submit RAPBS');
            },
        });
    };

    const rapbsRecords = rapbsRecordsData?.data || [];

    // Extract and filter data by search query
    const allUnits = rapbsData || [];
    const units = searchQuery
        ? allUnits.map(unit => ({
            ...unit,
            mata_anggarans: unit.mata_anggarans.filter(ma =>
                ma.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ma.kode.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(unit =>
            unit.mata_anggarans.length > 0 ||
            unit.unit_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.unit_kode.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allUnits;

    // Summaries
    const totalAnggaran = units.reduce(
        (sum, unit) => sum + unit.mata_anggarans.reduce((s, ma) => s + ma.total, 0),
        0,
    );
    const totalPlafonApbs = units.reduce(
        (sum, unit) => sum + unit.mata_anggarans.reduce((s, ma) => s + (ma.plafon_apbs ?? 0), 0),
        0,
    );
    const totalApbsTahunLalu = units.reduce(
        (sum, unit) => sum + unit.mata_anggarans.reduce((s, ma) => s + (ma.apbs_tahun_lalu ?? 0), 0),
        0,
    );
    const totalUnits = units.length;
    const totalItems = units.reduce((sum, unit) => sum + unit.mata_anggarans.length, 0);

    // Generate tahun anggaran filter options
    const tahunOptions = useMemo(() => {
        return getAcademicYearOptions().map((ay) => ({
            value: ay,
            label: `TA ${ay}`,
        }));
    }, []);

    // Get academic year labels from current filter
    const selectedYear = filterValues.tahun || defaultTahun;
    const academicYears = formatAcademicYear(selectedYear);

    const toggleMaExpand = (id: number) => {
        setExpandedMa((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Loading state for both views
    const isLoadingAny = viewMode === 'records' ? isLoadingRecords : isLoading;
    const isErrorAny = viewMode === 'records' ? isErrorRecords : isError;
    const errorAny = viewMode === 'records' ? errorRecords : error;

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="RAPBS - Rencana Anggaran"
                        description="Kelola dan submit rencana anggaran pendapatan dan belanja sekolah."
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('records')}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        viewMode === 'records'
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    <FileCheck className="h-4 w-4" />
                                    Status RAPBS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('aggregated')}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        viewMode === 'aggregated'
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Rekap Anggaran
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                {/* Filters */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={[
                            {
                                key: 'tahun',
                                label: 'Semua Tahun',
                                type: 'select',
                                options: tahunOptions,
                            },
                            ...(viewMode === 'records' ? [{
                                key: 'status',
                                label: 'Semua Status',
                                type: 'select' as const,
                                options: [
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'submitted', label: 'Submitted' },
                                    { value: 'in_review', label: 'In Review' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'revision_required', label: 'Perlu Revisi' },
                                    { value: 'rejected', label: 'Ditolak' },
                                    { value: 'apbs_generated', label: 'APBS Dibuat' },
                                ],
                            }] : []),
                        ]}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder={viewMode === 'records' ? "Cari unit..." : "Cari mata anggaran..."}
                    />
                </motion.div>

                {/* Loading state */}
                {isLoadingAny && (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Error state */}
                {isErrorAny && !isLoadingAny && (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50">
                        <p className="text-sm text-red-600">
                            {errorAny instanceof Error ? errorAny.message : 'Gagal memuat data RAPBS'}
                        </p>
                    </div>
                )}

                {/* RAPBS Records View (for status/submit) */}
                {viewMode === 'records' && !isLoadingAny && !isErrorAny && (
                    <div className="space-y-4">
                        {rapbsRecords.length === 0 ? (
                            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
                                <p className="text-sm text-slate-500">Tidak ada data RAPBS yang ditemukan.</p>
                            </div>
                        ) : (
                            rapbsRecords.map((rapbs) => (
                                <motion.div
                                    key={rapbs.id}
                                    {...cardHover}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                <Building2 className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {rapbs.unit?.nama || 'Unit tidak diketahui'}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                    <span>Kode: {rapbs.unit?.kode || '-'}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>Tahun: {rapbs.tahun}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>{rapbs.items_count || 0} item anggaran</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Total Anggaran</p>
                                                <p className="text-lg font-bold text-slate-900">
                                                    {formatRupiah(rapbs.total_anggaran)}
                                                </p>
                                            </div>
                                            <StatusBadge status={rapbs.status} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-5 py-4">
                                        <div className="flex items-center gap-6 text-sm">
                                            {rapbs.submitted_at && (
                                                <div>
                                                    <span className="text-slate-400">Submitted: </span>
                                                    <span className="text-slate-600">{formatDate(rapbs.submitted_at)}</span>
                                                </div>
                                            )}
                                            {rapbs.approved_at && (
                                                <div>
                                                    <span className="text-slate-400">Approved: </span>
                                                    <span className="text-slate-600">{formatDate(rapbs.approved_at)}</span>
                                                </div>
                                            )}
                                            {rapbs.current_approval_stage_label && (
                                                <div>
                                                    <span className="text-slate-400">Tahap: </span>
                                                    <span className="font-medium text-slate-600">{rapbs.current_approval_stage_label}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/planning/rapbs/${rapbs.id}`}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Detail
                                            </Link>
                                            {rapbs.can_submit && (
                                                <div className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSubmitRapbs(rapbs)}
                                                        disabled={submitRapbs.isPending || !!rapbs.is_over_budget}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {submitRapbs.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4" />
                                                        )}
                                                        Submit untuk Approval
                                                    </button>
                                                    {rapbs.is_over_budget && (
                                                        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                                            <p className="font-semibold">Total Anggaran melebihi Total Plafon</p>
                                                            <p className="mt-1">Sesuaikan anggaran agar tidak melebihi plafon sebelum mengajukan.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* Aggregated View (budget overview) */}
                {viewMode === 'aggregated' && !isLoadingAny && !isErrorAny && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard
                                title="Total Rencana Anggaran"
                                value={formatRupiah(totalAnggaran)}
                                icon={<Wallet className="h-5 w-5" />}
                                description="Keseluruhan unit"
                            />
                            <StatCard
                                title="Jumlah Unit"
                                value={totalUnits}
                                icon={<Building2 className="h-5 w-5" />}
                                description="Unit aktif"
                            />
                            <StatCard
                                title="Total Mata Anggaran"
                                value={totalItems}
                                icon={<BarChart3 className="h-5 w-5" />}
                                description="Item anggaran"
                            />
                        </div>

                        {/* Unit Cards */}
                        <div className="space-y-4">
                    {units.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
                            <p className="text-sm text-slate-500">Tidak ada data RAPBS yang ditemukan.</p>
                        </div>
                    ) : (
                        units.map((unit) => {
                            const unitTotal = unit.mata_anggarans.reduce((s, ma) => s + (ma.total ?? 0), 0);
                            const totals = unit.mata_anggarans.map((ma) => ma.total ?? 0);
                            const maxAnggaran = totals.length > 0 ? Math.max(...totals) : 0;

                            return (
                                <motion.div
                                    key={unit.unit_id}
                                    {...cardHover}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                >
                                    {/* Unit header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {unit.unit_nama}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Kode: {unit.unit_kode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Total Anggaran</p>
                                            <p className="text-base font-bold text-slate-900">
                                                {formatRupiah(unitTotal)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Item table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="w-10 px-2 py-2.5" />
                                                    <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Kode
                                                    </th>
                                                    <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Mata Anggaran
                                                    </th>
                                                    <th className="px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        APBS {academicYears.previous}
                                                    </th>
                                                    <th className="px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Realisasi Juni {academicYears.previous}
                                                    </th>
                                                    <th className="px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Plafon {academicYears.current}
                                                    </th>
                                                    <th className="px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Anggaran
                                                    </th>
                                                    <th className="px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Selisih
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {unit.mata_anggarans.map((ma) => {
                                                    const isExpanded = expandedMa.has(ma.id);

                                                    return (
                                                        <MataAnggaranRow
                                                            key={ma.id}
                                                            ma={ma}
                                                            isExpanded={isExpanded}
                                                            onToggle={() => toggleMaExpand(ma.id)}
                                                            onUpdateComparison={handleUpdateBudgetComparison}
                                                            isUpdating={updateBudgetComparison.isPending}
                                                            isAdmin={isAdmin}
                                                        />
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                {(() => {
                                                    const unitTotalApbsPrev = unit.mata_anggarans.reduce((s, ma) => s + (ma.apbs_tahun_lalu ?? 0), 0);
                                                    const unitTotalAsumsi = unit.mata_anggarans.reduce((s, ma) => s + (ma.asumsi_realisasi ?? 0), 0);
                                                    const unitTotalPlafon = unit.mata_anggarans.reduce((s, ma) => s + (ma.plafon_apbs ?? 0), 0);
                                                    const unitSelisih = unitTotalPlafon - unitTotal;
                                                    const isOverBudget = unitTotal > unitTotalPlafon;
                                                    return (
                                                        <tr className="border-t border-slate-200 bg-slate-50/50">
                                                            <td />
                                                            <td colSpan={2} className="px-2 py-3 text-sm font-semibold text-slate-700">
                                                                Total {unit.unit_nama}
                                                            </td>
                                                            <td className="px-2 py-3 text-right text-sm font-bold text-slate-900">
                                                                {formatRupiah(unitTotalApbsPrev)}
                                                            </td>
                                                            <td className="px-2 py-3 text-right text-sm font-bold text-slate-900">
                                                                {formatRupiah(unitTotalAsumsi)}
                                                            </td>
                                                            <td className="px-2 py-3 text-right text-sm font-bold text-slate-900">
                                                                {formatRupiah(unitTotalPlafon)}
                                                            </td>
                                                            <td className="px-2 py-3 text-right text-sm font-bold text-slate-900">
                                                                {formatRupiah(unitTotal)}
                                                            </td>
                                                            <td className={cn(
                                                                "px-2 py-3 text-right text-sm font-bold",
                                                                isOverBudget ? "text-red-600" : "text-emerald-600"
                                                            )}>
                                                                {formatRupiah(unitSelisih)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tfoot>
                                        </table>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                        </div>

                        {/* Grand total footer */}
                        {units.length > 0 && (() => {
                            const selisihPlafon = totalPlafonApbs - totalAnggaran;
                            const dalamPlafon = totalAnggaran <= totalPlafonApbs;
                            const selisihTahunLalu = totalAnggaran - totalApbsTahunLalu;
                            const persenKenaikan = totalApbsTahunLalu > 0
                                ? (selisihTahunLalu / totalApbsTahunLalu) * 100
                                : 0;
                            const persenTerhadapPlafon = totalPlafonApbs > 0
                                ? (totalAnggaran / totalPlafonApbs) * 100
                                : 0;
                            const isNaik = selisihTahunLalu >= 0;

                            // Chart data: overall aggregate comparison
                            const chartData = [
                                {
                                    label: `APBS ${academicYears.previous}`,
                                    value: totalApbsTahunLalu,
                                    fill: '#94a3b8',
                                },
                                {
                                    label: `Plafon ${academicYears.current}`,
                                    value: totalPlafonApbs,
                                    fill: '#0ea5e9',
                                },
                                {
                                    label: 'Diajukan',
                                    value: totalAnggaran,
                                    fill: dalamPlafon ? '#10b981' : '#ef4444',
                                },
                            ];

                            const formatCompact = (value: number): string => {
                                if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
                                if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`;
                                if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
                                return value.toString();
                            };

                            return (
                                <div>
                                    <div className={cn(
                                        "rounded-lg border px-5 py-4",
                                        dalamPlafon
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-red-200 bg-red-50"
                                    )}>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">APBS {academicYears.previous}</p>
                                                <p className="text-lg font-bold text-slate-900">
                                                    {formatRupiah(totalApbsTahunLalu)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Total Plafon APBS {academicYears.current}</p>
                                                <p className="text-lg font-bold text-slate-900">
                                                    {formatRupiah(totalPlafonApbs)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Total Anggaran Diajukan</p>
                                                <p className={cn(
                                                    "text-lg font-bold",
                                                    dalamPlafon ? "text-emerald-700" : "text-red-700"
                                                )}>
                                                    {formatRupiah(totalAnggaran)}
                                                </p>
                                                {totalPlafonApbs > 0 && (
                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                        {persenTerhadapPlafon.toFixed(2)}% dari plafon
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Selisih vs Plafon</p>
                                                <p className={cn(
                                                    "text-lg font-bold",
                                                    dalamPlafon ? "text-emerald-700" : "text-red-700"
                                                )}>
                                                    {formatRupiah(selisihPlafon)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Analisis perbandingan vs APBS tahun lalu */}
                                        {totalApbsTahunLalu > 0 && (
                                            <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Analisis vs APBS {academicYears.previous}
                                                </p>
                                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            {isNaik ? "Kenaikan" : "Penurunan"} Anggaran
                                                        </p>
                                                        <p className={cn(
                                                            "text-base font-semibold",
                                                            isNaik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {isNaik ? "+" : ""}{formatRupiah(selisihTahunLalu)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Persentase Perubahan</p>
                                                        <p className={cn(
                                                            "text-base font-semibold",
                                                            isNaik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {isNaik ? "▲" : "▼"} {Math.abs(persenKenaikan).toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-500">
                                                    Anggaran yang diajukan {isNaik ? "naik" : "turun"} sebesar{" "}
                                                    <span className="font-semibold text-slate-700">
                                                        {Math.abs(persenKenaikan).toFixed(2)}%
                                                    </span>{" "}
                                                    dibandingkan APBS {academicYears.previous}.
                                                </p>
                                            </div>
                                        )}

                                        {/* Chart: perbandingan keseluruhan */}
                                        {totalApbsTahunLalu + totalPlafonApbs + totalAnggaran > 0 && (
                                            <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Grafik Perbandingan Keseluruhan
                                                </p>
                                                <div className="mt-3 h-72 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={chartData}
                                                            margin={{ top: 24, right: 20, left: 10, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                            <XAxis
                                                                dataKey="label"
                                                                tick={{ fontSize: 12, fill: '#334155' }}
                                                            />
                                                            <YAxis
                                                                tickFormatter={formatCompact}
                                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                            />
                                                            <RechartsTooltip
                                                                formatter={(value) => [formatRupiah(Number(value)), 'Nilai']}
                                                                cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                                                contentStyle={{
                                                                    fontSize: 12,
                                                                    borderRadius: 6,
                                                                    border: '1px solid #e2e8f0',
                                                                }}
                                                            />
                                                            <Bar
                                                                dataKey="value"
                                                                radius={[6, 6, 0, 0]}
                                                                label={{
                                                                    position: 'top',
                                                                    formatter: (v) => formatCompact(Number(v)),
                                                                    fontSize: 11,
                                                                    fill: '#475569',
                                                                }}
                                                            >
                                                                {chartData.map((entry) => (
                                                                    <Cell key={entry.label} fill={entry.fill} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                                                    {chartData.map((d) => (
                                                        <div key={d.label} className="flex items-center gap-1.5">
                                                            <span
                                                                className="inline-block h-2.5 w-2.5 rounded-sm"
                                                                style={{ backgroundColor: d.fill }}
                                                            />
                                                            <span>{d.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center gap-2">
                                            <div className={cn(
                                                "rounded-full px-3 py-1 text-xs font-medium",
                                                dalamPlafon
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-700"
                                            )}>
                                                {dalamPlafon ? "Dalam Plafon" : "Melebihi Plafon"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Mata Anggaran Row with expandable Sub Mata Anggaran
// ---------------------------------------------------------------------------

interface MataAnggaranRowProps {
    ma: {
        id: number;
        kode: string;
        nama: string;
        total: number;
        apbs_tahun_lalu: number;
        asumsi_realisasi: number;
        plafon_apbs: number;
    };
    isExpanded: boolean;
    onToggle: () => void;
    onUpdateComparison: (id: number, field: 'apbs_tahun_lalu' | 'asumsi_realisasi', value: number) => void;
    isUpdating: boolean;
    isAdmin: boolean;
}

function MataAnggaranRow({ ma, isExpanded, onToggle, onUpdateComparison, isUpdating, isAdmin }: MataAnggaranRowProps) {
    const [expandedSub, setExpandedSub] = useState<Set<number>>(new Set());
    const [editingField, setEditingField] = useState<'apbs_tahun_lalu' | 'asumsi_realisasi' | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    // Calculate selisih
    const selisih = ma.plafon_apbs - ma.total;
    const isNegative = selisih < 0;

    // Fetch sub mata anggarans when expanded
    const {
        data: subMataAnggaransResponse,
        isLoading: isLoadingSubs,
        isError: isSubsError,
    } = useSubMataAnggarans(isExpanded ? ma.id : null, { per_page: 100 });

    const subs = subMataAnggaransResponse?.data || [];

    const toggleSubExpand = (id: number) => {
        setExpandedSub((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleStartEdit = (field: 'apbs_tahun_lalu' | 'asumsi_realisasi') => {
        setEditingField(field);
        setEditValue(ma[field]);
    };

    const handleSaveEdit = () => {
        if (editingField) {
            onUpdateComparison(ma.id, editingField, editValue);
            setEditingField(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
    };

    return (
        <>
            <tr className="hover:bg-slate-50/50">
                <td className="px-2 py-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle();
                        }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </td>
                <td className="px-2 py-2 font-mono text-xs text-blue-600">
                    {ma.kode}
                </td>
                <td className="px-2 py-2 text-sm text-slate-700">
                    {ma.nama}
                </td>
                {/* APBS Tahun Lalu - Editable only for Admin */}
                <td className="px-2 py-2 text-right">
                    {isAdmin && editingField === 'apbs_tahun_lalu' ? (
                        <div className="flex items-center justify-end gap-1">
                            <CurrencyInput
                                value={editValue}
                                onChange={setEditValue}
                                className="w-28 text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isUpdating}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : isAdmin ? (
                        <button
                            type="button"
                            onClick={() => handleStartEdit('apbs_tahun_lalu')}
                            className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                            {formatRupiah(ma.apbs_tahun_lalu)}
                        </button>
                    ) : (
                        <span className="text-xs font-medium text-slate-700">
                            {formatRupiah(ma.apbs_tahun_lalu)}
                        </span>
                    )}
                </td>
                {/* Asumsi Realisasi - Editable only for Admin */}
                <td className="px-2 py-2 text-right">
                    {isAdmin && editingField === 'asumsi_realisasi' ? (
                        <div className="flex items-center justify-end gap-1">
                            <CurrencyInput
                                value={editValue}
                                onChange={setEditValue}
                                className="w-28 text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isUpdating}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : isAdmin ? (
                        <button
                            type="button"
                            onClick={() => handleStartEdit('asumsi_realisasi')}
                            className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                            {formatRupiah(ma.asumsi_realisasi)}
                        </button>
                    ) : (
                        <span className="text-xs font-medium text-slate-700">
                            {formatRupiah(ma.asumsi_realisasi)}
                        </span>
                    )}
                </td>
                {/* Plafon APBS - Calculated, Read-only */}
                <td className="px-2 py-2 text-right text-xs font-medium text-slate-900">
                    {formatRupiah(ma.plafon_apbs)}
                </td>
                {/* Anggaran (from PKT) */}
                <td className="px-2 py-2 text-right text-xs font-medium text-slate-900">
                    {formatRupiah(ma.total)}
                </td>
                {/* Selisih */}
                <td className={cn(
                    "px-2 py-2 text-right text-xs font-medium",
                    isNegative ? "text-red-600" : "text-emerald-600"
                )}>
                    {formatRupiah(selisih)}
                </td>
            </tr>

            {/* Expanded Sub Mata Anggaran */}
            {isExpanded && (
                <tr className="bg-slate-50/30">
                    <td colSpan={8} className="px-0 py-0">
                        <div className="py-3 pl-12 pr-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sub Mata Anggaran
                            </p>
                            {isSubsError ? (
                                <div className="py-4 text-sm text-red-500">
                                    Gagal memuat sub mata anggaran
                                </div>
                            ) : isLoadingSubs ? (
                                <div className="flex items-center gap-2 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-slate-500">Memuat...</span>
                                </div>
                            ) : subs.length === 0 ? (
                                <div className="py-4 text-sm text-slate-500">
                                    Tidak ada sub mata anggaran.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {subs.map((sub) => (
                                        <SubMataAnggaranRow
                                            key={sub.id}
                                            sub={sub}
                                            mataAnggaranId={ma.id}
                                            isExpanded={expandedSub.has(sub.id)}
                                            onToggle={() => toggleSubExpand(sub.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Sub Mata Anggaran Row with expandable Detail Mata Anggaran
// ---------------------------------------------------------------------------

interface SubMataAnggaranRowProps {
    sub: {
        id: number;
        kode: string;
        nama: string;
        unit?: { nama: string } | null;
    };
    mataAnggaranId: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function SubMataAnggaranRow({ sub, mataAnggaranId, isExpanded, onToggle }: SubMataAnggaranRowProps) {
    // Fetch detail mata anggarans when expanded
    const {
        data: detailMataAnggaransResponse,
        isLoading: isLoadingDetails,
        isError: isDetailsError,
    } = useDetailMataAnggarans(
        isExpanded ? { mata_anggaran_id: mataAnggaranId, sub_mata_anggaran_id: sub.id, per_page: 100 } : null
    );

    const details = detailMataAnggaransResponse?.data || [];

    return (
        <div className="rounded-md border border-slate-200 bg-white">
            <div
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                onClick={onToggle}
            >
                <button
                    type="button"
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                    )}
                </button>
                <span className="font-mono text-xs font-medium text-blue-600">
                    {sub.kode}
                </span>
                <span className="flex-1 text-sm text-slate-700">
                    {sub.nama}
                </span>
            </div>

            {/* Expanded Detail Mata Anggaran */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Detail Mata Anggaran
                    </p>
                    {isDetailsError ? (
                        <div className="py-2 text-sm text-red-500">
                            Gagal memuat detail
                        </div>
                    ) : isLoadingDetails ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-500">Memuat...</span>
                        </div>
                    ) : details.length === 0 ? (
                        <div className="py-2 text-sm text-slate-500">
                            Tidak ada detail mata anggaran.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {details.map((detail) => (
                                <div
                                    key={detail.id}
                                    className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2"
                                >
                                    <span className="font-mono text-xs font-medium text-emerald-600">
                                        {detail.kode ?? '-'}
                                    </span>
                                    <span className="flex-1 text-sm text-slate-700">
                                        {detail.nama ?? '-'}
                                    </span>
                                    {detail.volume && detail.satuan && (
                                        <span className="text-xs text-slate-500">
                                            {detail.volume} {detail.satuan}
                                        </span>
                                    )}
                                    {detail.harga_satuan && (
                                        <span className="text-xs text-slate-500">
                                            @ {formatRupiah(Number(detail.harga_satuan))}
                                        </span>
                                    )}
                                    {detail.jumlah && (
                                        <span className="text-xs font-medium text-slate-700">
                                            {formatRupiah(Number(detail.jumlah))}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
