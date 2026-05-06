import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Eye, Trash2, Loader2 } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { usePerubahanList, useDeletePerubahan } from '@/hooks/usePerubahan';
import { getAcademicYearOptions } from '@/stores/authStore';
import type { Perubahan } from '@/services/perubahanService';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerubahanList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Fetch data from API
    const { data, isLoading, isError } = usePerubahanList({
        page,
        per_page: 15,
        tahun: filterValues.tahun || undefined,
    });

    const deleteMutation = useDeletePerubahan();

    // Filter for tahun only (unit filter removed since backend filters by user)
    const filters = [
        {
            key: 'tahun',
            label: 'Tahun',
            type: 'select' as const,
            options: getAcademicYearOptions().map((y) => ({ value: y, label: `TA ${y}` })),
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: 'perubahan', label: 'Perubahan' },
            ],
        },
    ];

    // Filter data by search query
    const filteredData = useMemo(() => {
        if (!data?.data) return [];
        if (!searchQuery) return data.data;

        const query = searchQuery.toLowerCase();
        return data.data.filter((row) =>
            row.nama_pengajuan?.toLowerCase().includes(query) ||
            row.unit?.toLowerCase().includes(query)
        );
    }, [data?.data, searchQuery]);

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const columns: ColumnDef<Perubahan, unknown>[] = [
        {
            accessorKey: 'nama_pengajuan',
            header: 'Nama Pengajuan',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.nama_pengajuan}</span>
            ),
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
        },
        {
            accessorKey: 'tahun',
            header: 'Tahun',
        },
        {
            accessorKey: 'jumlah_pengajuan_total',
            header: 'Jumlah',
            cell: ({ row }) => (
                <span className="font-medium">{formatRupiah(row.original.jumlah_pengajuan_total)}</span>
            ),
        },
        {
            accessorKey: 'status_revisi',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status_revisi || 'perubahan'} />,
        },
        {
            accessorKey: 'date_revisi',
            header: 'Tanggal Perubahan',
            cell: ({ row }) => (
                <span className="text-slate-500">
                    {row.original.date_revisi ? formatDate(row.original.date_revisi) : '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pengajuan/${row.original.id}`);
                        }}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Lihat detail pengajuan"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleDelete(row.original.id, e)}
                        disabled={deleteMutation.isPending}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Hapus status perubahan"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex min-h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (isError) {
        return (
            <PageTransition>
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                    <p className="text-red-600">Gagal memuat data perubahan.</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-blue-600 underline"
                    >
                        Coba lagi
                    </button>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Perubahan Anggaran"
                        description="Daftar pengajuan yang ditandai sebagai perubahan"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/perubahan-anggaran/create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Geser Anggaran
                            </button>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari perubahan anggaran..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        searchValue={searchQuery}
                        onRowClick={(row) => navigate(`/pengajuan/${row.id}`)}
                        emptyTitle="Belum ada perubahan anggaran"
                        emptyDescription="Belum ada pengajuan yang ditandai sebagai perubahan."
                        pagination={data?.meta ? {
                            pageIndex: data.meta.current_page - 1,
                            pageSize: data.meta.per_page ?? 15,
                            pageCount: data.meta.last_page,
                            onPageChange: (page) => setPage(page + 1),
                            onPageSizeChange: () => {},
                        } : undefined}
                    />
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                title="Hapus Perubahan"
                description="Apakah Anda yakin ingin menghapus status perubahan ini?"
                confirmLabel="Hapus"
                variant="destructive"
                isLoading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteId !== null) {
                        deleteMutation.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                        });
                    }
                }}
            />
        </PageTransition>
    );
}
