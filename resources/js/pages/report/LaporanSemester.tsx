import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useCawuGabungan, useCawuUnit, useExportLaporanExcel, useExportLaporanPdf } from '@/hooks/useLaporan';
import { useUnitsList } from '@/hooks/useUnits';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LaporanSemester() {
    const [filterValues, setFilterValues] = useState<Record<string, string>>({
        tahun: getCurrentAcademicYear(),
    });
    const [viewMode, setViewMode] = useState<'unit' | 'gabungan'>('gabungan');

    // Fetch data from API
    const { data: units } = useUnitsList();

    // Use cawu-gabungan for combined view, cawu-unit for per-unit view
    const { data: gabunganData, isLoading: isLoadingGabungan, isError: isErrorGabungan } = useCawuGabungan({
        unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        tahun: filterValues.tahun,
    });

    const { data: unitData, isLoading: isLoadingUnit, isError: isErrorUnit } = useCawuUnit(
        {
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
            tahun: filterValues.tahun || getCurrentAcademicYear(),
        },
        viewMode === 'unit' && !!filterValues.unit_id,
    );

    const exportExcel = useExportLaporanExcel();
    const exportPdf = useExportLaporanPdf();

    const isLoading = viewMode === 'gabungan' ? isLoadingGabungan : isLoadingUnit;
    const isError = viewMode === 'gabungan' ? isErrorGabungan : isErrorUnit;

    const filters = useMemo(() => [
        {
            key: 'unit_id',
            label: 'Unit',
            type: 'select' as const,
            options: units?.map((u) => ({ value: String(u.id), label: u.nama })) || [],
        },
        {
            key: 'tahun',
            label: 'Tahun Ajaran',
            type: 'select' as const,
            options: [
                ...getAcademicYearOptions().map(y => ({ value: y, label: `TA ${y}` })),
            ],
        },
    ], [units]);

    // Transform gabungan data for table and chart
    const tableData = useMemo(() => {
        if (viewMode === 'gabungan' && gabunganData?.units) {
            return gabunganData.units.map((unit) => ({
                kode: unit.unit_kode,
                nama: unit.unit_nama,
                anggaran: unit.total_anggaran,
                pengajuan: unit.total_pengajuan,
                realisasi: unit.total_realisasi,
                sisa: unit.sisa_anggaran,
            }));
        }
        return [];
    }, [gabunganData, viewMode]);

    const chartData = useMemo(() => {
        return tableData.map((row) => ({
            name: row.kode,
            Anggaran: row.anggaran / 1000000,
            Pengajuan: row.pengajuan / 1000000,
            Realisasi: row.realisasi / 1000000,
        }));
    }, [tableData]);

    const totalAnggaran = gabunganData?.grand_total?.anggaran || 0;
    const totalRealisasi = gabunganData?.grand_total?.realisasi || 0;
    const persentase = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0';

    const handleExportExcel = () => {
        exportExcel.mutate({
            type: 'realisasi',
            tahun: filterValues.tahun || getCurrentAcademicYear(),
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        });
    };

    const handleExportPdf = () => {
        exportPdf.mutate({
            type: 'realisasi',
            tahun: filterValues.tahun || getCurrentAcademicYear(),
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        });
    };

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Laporan Semester"
                        description="Laporan realisasi anggaran per semester"
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
                        className="mb-4"
                    />
                </motion.div>

                {/* Toggle */}
                <motion.div variants={staggerItem} className="mb-4">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('unit')}
                            className={cn(
                                'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                viewMode === 'unit'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900',
                            )}
                        >
                            Per Unit
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('gabungan')}
                            className={cn(
                                'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                viewMode === 'gabungan'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900',
                            )}
                        >
                            Gabungan
                        </button>
                    </div>
                </motion.div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : isError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-600">Gagal memuat data laporan.</p>
                    </div>
                ) : viewMode === 'unit' && !filterValues.unit_id ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                        <p className="text-amber-600">Silakan pilih unit terlebih dahulu untuk melihat laporan per unit.</p>
                    </div>
                ) : (
                    <>
                        {/* Summary cards */}
                        <motion.div variants={staggerItem} className="mb-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <p className="text-xs font-medium text-slate-500">Total Anggaran</p>
                                <p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(totalAnggaran)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <p className="text-xs font-medium text-slate-500">Total Realisasi</p>
                                <p className="mt-1 text-xl font-bold text-blue-600">{formatRupiah(totalRealisasi)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <p className="text-xs font-medium text-slate-500">Persentase Realisasi</p>
                                <p className="mt-1 text-xl font-bold text-emerald-600">{persentase}%</p>
                            </div>
                        </motion.div>

                        {/* Chart - only show for gabungan view */}
                        {viewMode === 'gabungan' && chartData.length > 0 && (
                            <motion.div
                                variants={staggerItem}
                                className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
                            >
                                <h3 className="mb-4 text-base font-semibold text-slate-900">
                                    Grafik Realisasi Anggaran per Unit
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${v}jt`} />
                                            <Tooltip
                                                formatter={(value: number | undefined) => [`Rp ${(value ?? 0).toFixed(0)}jt`, '']}
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="Anggaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Pengajuan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Realisasi" fill="#059669" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}

                        {/* Table */}
                        {viewMode === 'gabungan' && (
                            <motion.div
                                variants={staggerItem}
                                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kode</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Unit</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Anggaran</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Pengajuan</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Realisasi</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Sisa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tableData.map((row) => (
                                                <tr key={row.kode} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-blue-600">{row.kode}</td>
                                                    <td className="px-4 py-3 text-slate-700">{row.nama}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{formatRupiah(row.anggaran)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{formatRupiah(row.pengajuan)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatRupiah(row.realisasi)}</td>
                                                    <td className={cn(
                                                        'px-4 py-3 text-right font-medium',
                                                        row.sisa >= 0 ? 'text-emerald-600' : 'text-red-600',
                                                    )}>
                                                        {formatRupiah(row.sisa)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                                                <td colSpan={2} className="px-4 py-3 text-slate-700">Total</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatRupiah(gabunganData?.grand_total?.anggaran || 0)}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatRupiah(gabunganData?.grand_total?.pengajuan || 0)}</td>
                                                <td className="px-4 py-3 text-right text-blue-600">{formatRupiah(gabunganData?.grand_total?.realisasi || 0)}</td>
                                                <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(gabunganData?.grand_total?.sisa || 0)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* Unit detail view */}
                        {viewMode === 'unit' && unitData && (
                            <motion.div
                                variants={staggerItem}
                                className="rounded-lg border border-slate-200 bg-white p-6"
                            >
                                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                    {unitData.unit_nama} ({unitData.unit_kode})
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">Total Pengajuan</p>
                                        <p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(unitData.total_pengajuan)}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">Total Realisasi</p>
                                        <p className="mt-1 text-xl font-bold text-blue-600">{formatRupiah(unitData.total_realisasi)}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">Total Penerimaan</p>
                                        <p className="mt-1 text-xl font-bold text-emerald-600">{formatRupiah(unitData.total_penerimaan)}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">Jumlah Pengajuan</p>
                                        <p className="mt-1 text-xl font-bold text-slate-900">{unitData.pengajuans_count}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </motion.div>
        </PageTransition>
    );
}
