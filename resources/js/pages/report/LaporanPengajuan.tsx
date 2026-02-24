import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useLaporanPengajuan, useExportLaporanExcel, useExportLaporanPdf } from '@/hooks/useLaporan';
import { useUnitsList } from '@/hooks/useUnits';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';
import type { LaporanPengajuanParams } from '@/services/laporanService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LaporanRow {
    id: number;
    nomor: string;
    perihal: string;
    unit: string;
    total_amount: number;
    status: string;
    current_stage: string;
    tanggal: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LaporanPengajuan() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});

    // Build API params from filter values
    const apiParams: LaporanPengajuanParams = useMemo(() => {
        const params: LaporanPengajuanParams = {};
        if (filterValues.unit_id) params.unit_id = Number(filterValues.unit_id);
        if (filterValues.tahun) params.tahun = filterValues.tahun;
        if (filterValues.status) params.status = filterValues.status;
        if (filterValues.date_from) params.from = filterValues.date_from;
        if (filterValues.date_to) params.to = filterValues.date_to;
        return params;
    }, [filterValues]);

    // Fetch data from API
    const { data: laporanData, isLoading, isError } = useLaporanPengajuan(apiParams);
    const { data: units } = useUnitsList();
    const exportExcel = useExportLaporanExcel();
    const exportPdf = useExportLaporanPdf();

    // Transform API data to table format
    const tableData: LaporanRow[] = useMemo(() => {
        if (!laporanData?.data) return [];
        return laporanData.data.map((item) => ({
            id: item.id,
            nomor: item.no_surat || '-',
            perihal: item.perihal,
            unit: item.unit?.nama || '-',
            total_amount: item.jumlah_pengajuan_total,
            status: item.status_proses,
            current_stage: item.current_approval_stage || '-',
            tanggal: item.created_at,
        }));
    }, [laporanData]);

    // Filter by search query (client-side)
    const filteredData = useMemo(() => {
        if (!searchQuery) return tableData;
        const query = searchQuery.toLowerCase();
        return tableData.filter(
            (row) =>
                row.nomor.toLowerCase().includes(query) ||
                row.perihal.toLowerCase().includes(query) ||
                row.unit.toLowerCase().includes(query),
        );
    }, [tableData, searchQuery]);

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
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'in_review', label: 'In Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'revised', label: 'Revised' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'paid', label: 'Paid' },
            ],
        },
        {
            key: 'date_from',
            label: 'Dari Tanggal',
            type: 'date' as const,
        },
        {
            key: 'date_to',
            label: 'Sampai Tanggal',
            type: 'date' as const,
        },
    ], [units]);

    const totalAmount = laporanData?.summary?.total_amount || 0;
    const totalCount = laporanData?.summary?.total_count || 0;

    const columns: ColumnDef<LaporanRow, unknown>[] = [
        {
            accessorKey: 'nomor',
            header: 'No Surat',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.nomor}</span>
            ),
        },
        {
            accessorKey: 'perihal',
            header: 'Perihal',
            cell: ({ row }) => (
                <span className="max-w-[220px] truncate block">{row.original.perihal}</span>
            ),
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-medium">{formatRupiah(row.original.total_amount)}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'current_stage',
            header: 'Tahap',
            cell: ({ row }) => (
                <span className="text-xs text-slate-500">{row.original.current_stage}</span>
            ),
        },
        {
            accessorKey: 'tanggal',
            header: 'Tanggal',
            cell: ({ row }) => (
                <span className="text-slate-500">{formatDate(row.original.tanggal)}</span>
            ),
        },
    ];

    const handleExportExcel = () => {
        exportExcel.mutate({
            type: 'pengajuan',
            tahun: filterValues.tahun || getCurrentAcademicYear(),
            unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
        });
    };

    const handleExportPdf = () => {
        exportPdf.mutate({
            type: 'pengajuan',
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
                        title="Laporan Pengajuan"
                        description="Laporan seluruh pengajuan anggaran"
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
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari pengajuan..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : isError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                            <p className="text-red-600">Gagal memuat data laporan.</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            searchValue={searchQuery}
                            emptyTitle="Tidak ada data"
                            emptyDescription="Tidak ditemukan pengajuan yang sesuai dengan filter."
                        />
                    )}
                </motion.div>

                {/* Summary row */}
                <motion.div
                    variants={staggerItem}
                    className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs font-medium text-blue-600">Total Data</p>
                                <p className="text-lg font-bold text-blue-700">{totalCount} pengajuan</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-blue-600">Total Anggaran</p>
                                <p className="text-lg font-bold text-blue-700">{formatRupiah(totalAmount)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
