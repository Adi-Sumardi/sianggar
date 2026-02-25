import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Eye, Pencil, Trash2, Loader2, ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useLpjList, useDeleteLpj, useLpjStats } from '@/hooks/useLpj';
import { getAcademicYearOptions } from '@/stores/authStore';
import type { Lpj } from '@/types/models';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LpjList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Lpj | null }>({
        open: false,
        item: null,
    });

    // Fetch data from API - backend automatically filters by user's unit_id
    const { data: lpjResponse, isLoading, isError, error } = useLpjList({
        search: searchQuery || undefined,
        tahun: filterValues.tahun || undefined,
        status: filterValues.status || undefined,
        // Note: unit_id filter is handled automatically by backend based on user role
    });

    // Fetch LPJ stats
    const { data: stats } = useLpjStats();

    const deleteMutation = useDeleteLpj();

    // Extract data from paginated response
    const lpjData = (lpjResponse?.data || []) as Lpj[];

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
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'validated', label: 'Validated' },
                { value: 'approved-middle', label: 'Approved (Middle)' },
                { value: 'approved', label: 'Approved' },
                { value: 'revised', label: 'Revised' },
                { value: 'rejected', label: 'Rejected' },
            ],
        },
    ];

    const columns: ColumnDef<Lpj, unknown>[] = [
        {
            accessorKey: 'no_surat',
            header: 'No Surat',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.no_surat ?? '-'}</span>
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
            id: 'unit',
            header: 'Unit',
            cell: ({ row }) => (
                <span>{row.original.unit ?? '-'}</span>
            ),
        },
        {
            id: 'pengajuan_terkait',
            header: 'Pengajuan Terkait',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-slate-500">
                    {row.original.pengajuan_anggaran?.nomor_pengajuan ?? '-'}
                </span>
            ),
        },
        {
            accessorKey: 'input_realisasi',
            header: 'Realisasi',
            cell: ({ row }) => (
                <span className="font-medium">{formatRupiah(row.original.input_realisasi ?? 0)}</span>
            ),
        },
        {
            accessorKey: 'proses',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.proses ?? 'draft'} />,
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => {
                const status = row.original.proses ?? 'draft';
                return (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/lpj/${row.original.id}`);
                            }}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Lihat detail"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        {status === 'draft' && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/lpj/${row.original.id}/edit`);
                                    }}
                                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                    title="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialog({ open: true, item: row.original });
                                    }}
                                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    title="Hapus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteMutation.mutateAsync(deleteDialog.item.id);
            toast.success(`LPJ "${deleteDialog.item.perihal}" berhasil dihapus`);
            setDeleteDialog({ open: false, item: null });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus LPJ');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data LPJ'}
                    </p>
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
                        title="Laporan Pertanggungjawaban (LPJ)"
                        description="Kelola laporan pertanggungjawaban penggunaan anggaran"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/lpj/create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Buat LPJ
                            </button>
                        }
                    />
                </motion.div>

                {/* Stats Cards - Always show when stats data is available */}
                {stats && (
                    <motion.div variants={staggerItem} className="mb-4 grid gap-4 sm:grid-cols-2">
                        {/* Menunggu LPJ Card */}
                        <div className={`rounded-lg border p-4 ${
                            stats.pending_lpj_count > 0
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-emerald-200 bg-emerald-50'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                    stats.pending_lpj_count > 0
                                        ? 'bg-amber-100'
                                        : 'bg-emerald-100'
                                }`}>
                                    {stats.pending_lpj_count > 0 ? (
                                        <ClipboardList className="h-5 w-5 text-amber-600" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        stats.pending_lpj_count > 0
                                            ? 'text-amber-800'
                                            : 'text-emerald-800'
                                    }`}>
                                        Menunggu LPJ
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        stats.pending_lpj_count > 0
                                            ? 'text-amber-900'
                                            : 'text-emerald-900'
                                    }`}>
                                        {stats.pending_lpj_count}
                                    </p>
                                    <p className={`text-xs ${
                                        stats.pending_lpj_count > 0
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                    }`}>
                                        {stats.pending_lpj_count > 0
                                            ? 'Pengajuan yang perlu dibuat LPJ-nya'
                                            : 'Semua pengajuan sudah memiliki LPJ'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LPJ Perlu Revisi Card */}
                        <div className={`rounded-lg border p-4 ${
                            stats.revised_lpj_count > 0
                                ? 'border-red-200 bg-red-50'
                                : 'border-emerald-200 bg-emerald-50'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                    stats.revised_lpj_count > 0
                                        ? 'bg-red-100'
                                        : 'bg-emerald-100'
                                }`}>
                                    {stats.revised_lpj_count > 0 ? (
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        stats.revised_lpj_count > 0
                                            ? 'text-red-800'
                                            : 'text-emerald-800'
                                    }`}>
                                        LPJ Perlu Revisi
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        stats.revised_lpj_count > 0
                                            ? 'text-red-900'
                                            : 'text-emerald-900'
                                    }`}>
                                        {stats.revised_lpj_count}
                                    </p>
                                    <p className={`text-xs ${
                                        stats.revised_lpj_count > 0
                                            ? 'text-red-600'
                                            : 'text-emerald-600'
                                    }`}>
                                        {stats.revised_lpj_count > 0
                                            ? 'LPJ yang perlu diperbaiki'
                                            : 'Tidak ada LPJ yang perlu diperbaiki'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari LPJ..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={lpjData}
                        searchValue={searchQuery}
                        onRowClick={(row) => navigate(`/lpj/${row.id}`)}
                        emptyTitle="Belum ada LPJ"
                        emptyDescription="Klik 'Buat LPJ' untuk membuat laporan pertanggungjawaban baru."
                    />
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => {
                    if (!open) setDeleteDialog({ open: false, item: null });
                }}
                title="Hapus LPJ"
                description={`Apakah Anda yakin ingin menghapus LPJ "${deleteDialog.item?.perihal ?? ''}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </PageTransition>
    );
}
