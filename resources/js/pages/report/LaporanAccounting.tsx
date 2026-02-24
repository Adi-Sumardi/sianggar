import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Wallet, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { StatCard } from '@/components/common/StatCard';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useAccounting, useExportLaporanExcel, useExportLaporanPdf } from '@/hooks/useLaporan';
import { useUnitsList } from '@/hooks/useUnits';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LaporanAccounting() {
    const [filterValues, setFilterValues] = useState<Record<string, string>>({
        tahun: getCurrentAcademicYear(),
    });

    // Fetch data from API
    const { data: units } = useUnitsList();
    const { data: accountingData, isLoading, isError } = useAccounting({
        unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        tahun: filterValues.tahun,
    });

    const exportExcel = useExportLaporanExcel();
    const exportPdf = useExportLaporanPdf();

    const filters = useMemo(() => [
        {
            key: 'unit_id',
            label: 'Unit',
            type: 'select' as const,
            options: units?.map((u) => ({ value: String(u.id), label: u.nama })) || [],
        },
        {
            key: 'tahun',
            label: 'Tahun',
            type: 'select' as const,
            options: [
                ...getAcademicYearOptions().map(y => ({ value: y, label: `TA ${y}` })),
            ],
        },
    ], [units]);

    const totalPenerimaan = accountingData?.total_penerimaan || 0;
    const totalPengeluaran = accountingData?.total_realisasi || 0;
    const selisih = totalPenerimaan - totalPengeluaran;

    const penerimaanData = accountingData?.penerimaan_by_unit || [];
    const pengeluaranData = accountingData?.realisasi_by_unit || [];

    const handleExportExcel = () => {
        exportExcel.mutate({
            type: 'penerimaan',
            tahun: filterValues.tahun || getCurrentAcademicYear(),
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        });
    };

    const handleExportPdf = () => {
        exportPdf.mutate({
            type: 'penerimaan',
            tahun: filterValues.tahun || getCurrentAcademicYear(),
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        });
    };

    const renderPenerimaanTable = () => (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <h3 className="text-sm font-semibold">Penerimaan</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Unit</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {penerimaanData.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                                    Tidak ada data penerimaan.
                                </td>
                            </tr>
                        ) : (
                            penerimaanData.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-700">{row.unit || '-'}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatRupiah(row.total)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                            <td className="px-4 py-3 text-slate-700">Total Penerimaan</td>
                            <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(totalPenerimaan)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    const renderPengeluaranTable = () => (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-red-800">
                <h3 className="text-sm font-semibold">Pengeluaran (Realisasi)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Unit</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Anggaran</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Realisasi</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Sisa</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pengeluaranData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                    Tidak ada data pengeluaran.
                                </td>
                            </tr>
                        ) : (
                            pengeluaranData.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-700">{row.unit || '-'}</td>
                                    <td className="px-4 py-3 text-right text-slate-700">{formatRupiah(row.total_anggaran)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatRupiah(row.total_realisasi)}</td>
                                    <td className={cn(
                                        'px-4 py-3 text-right font-medium',
                                        row.total_sisa >= 0 ? 'text-emerald-600' : 'text-red-600',
                                    )}>
                                        {formatRupiah(row.total_sisa)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                            <td className="px-4 py-3 text-slate-700">Total Pengeluaran</td>
                            <td className="px-4 py-3 text-right text-slate-900">
                                {formatRupiah(pengeluaranData.reduce((s, r) => s + r.total_anggaran, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600">{formatRupiah(totalPengeluaran)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">
                                {formatRupiah(pengeluaranData.reduce((s, r) => s + r.total_sisa, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Laporan Akuntansi"
                        description="Ringkasan penerimaan dan pengeluaran"
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    disabled={exportExcel.isPending}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {exportExcel.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileSpreadsheet className="h-4 w-4" />
                                    )}
                                    Export Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportPdf}
                                    disabled={exportPdf.isPending}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                                >
                                    {exportPdf.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )}
                                    Export PDF
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        className="mb-6"
                    />
                </motion.div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : isError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-600">Gagal memuat data laporan.</p>
                    </div>
                ) : (
                    <>
                        {/* Summary cards */}
                        <motion.div variants={staggerItem} className="mb-6 grid gap-4 sm:grid-cols-3">
                            <StatCard
                                title="Total Penerimaan"
                                value={formatRupiah(totalPenerimaan)}
                                icon={<TrendingUp className="h-5 w-5" />}
                                description={`Tahun ${filterValues.tahun || getCurrentAcademicYear()}`}
                            />
                            <StatCard
                                title="Total Pengeluaran"
                                value={formatRupiah(totalPengeluaran)}
                                icon={<TrendingDown className="h-5 w-5" />}
                                description={`Tahun ${filterValues.tahun || getCurrentAcademicYear()}`}
                            />
                            <StatCard
                                title="Selisih"
                                value={formatRupiah(selisih)}
                                icon={<Wallet className="h-5 w-5" />}
                                trend={totalPenerimaan > 0 ? { value: (selisih / totalPenerimaan) * 100, isUp: selisih >= 0 } : undefined}
                            />
                        </motion.div>

                        {/* Penerimaan table */}
                        <motion.div variants={staggerItem} className="mb-6">
                            {renderPenerimaanTable()}
                        </motion.div>

                        {/* Pengeluaran table */}
                        <motion.div variants={staggerItem}>
                            {renderPengeluaranTable()}
                        </motion.div>

                        {/* Bottom summary */}
                        <motion.div
                            variants={staggerItem}
                            className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-8">
                                    <div>
                                        <p className="text-xs font-medium text-blue-600">Total Penerimaan</p>
                                        <p className="text-lg font-bold text-emerald-700">{formatRupiah(totalPenerimaan)}</p>
                                    </div>
                                    <div className="text-2xl text-slate-300">-</div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-600">Total Pengeluaran</p>
                                        <p className="text-lg font-bold text-red-700">{formatRupiah(totalPengeluaran)}</p>
                                    </div>
                                    <div className="text-2xl text-slate-300">=</div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-600">Selisih</p>
                                        <p className={cn(
                                            'text-lg font-bold',
                                            selisih >= 0 ? 'text-emerald-700' : 'text-red-700',
                                        )}>
                                            {formatRupiah(selisih)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>
        </PageTransition>
    );
}
