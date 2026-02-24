import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Eye, Pencil, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
    usePerubahanAnggarans,
    useDeletePerubahanAnggaran,
} from '@/hooks/usePerubahanAnggaran';
import { useAuth } from '@/hooks/useAuth';
import { getAcademicYearOptions } from '@/stores/authStore';
import type { PerubahanAnggaran } from '@/types/models';
import {
    PerubahanAnggaranStatus,
    getPerubahanAnggaranStatusLabel,
    getPerubahanAnggaranStatusColor,
    getStageLabel,
} from '@/types/enums';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerubahanAnggaranList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        item: PerubahanAnggaran | null;
    }>({
        open: false,
        item: null,
    });

    // Fetch data from API
    const {
        data: perubahanResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = usePerubahanAnggarans({
        search: searchQuery || undefined,
        tahun: filterValues.tahun || undefined,
        status: filterValues.status || undefined,
    });

    const deleteMutation = useDeletePerubahanAnggaran();

    // Extract data
    const perubahanData = useMemo(() => {
        const data = (perubahanResponse?.data || []) as PerubahanAnggaran[];
        // Sort: revision-required first, then by created_at desc
        return [...data].sort((a, b) => {
            const aStatus = typeof a.status === 'string' ? a.status : a.status;
            const bStatus = typeof b.status === 'string' ? b.status : b.status;
            const aIsRevision = aStatus === 'revision-required';
            const bIsRevision = bStatus === 'revision-required';

            if (aIsRevision && !bIsRevision) return -1;
            if (!aIsRevision && bIsRevision) return 1;

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [perubahanResponse]);

    // Filters
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
                { value: 'draft', label: 'Draf' },
                { value: 'submitted', label: 'Diajukan' },
                { value: 'revision-required', label: 'Perlu Revisi' },
                { value: 'approved-level-1', label: 'Disetujui Level 1' },
                { value: 'approved-level-2', label: 'Disetujui Level 2' },
                { value: 'approved-level-3', label: 'Disetujui Level 3' },
                { value: 'approved-level-4', label: 'Disetujui Level 4' },
                { value: 'processed', label: 'Diproses' },
                { value: 'rejected', label: 'Ditolak' },
            ],
        },
    ];

    // Table columns
    const columns: ColumnDef<PerubahanAnggaran>[] = [
        {
            accessorKey: 'nomor_perubahan',
            header: 'No. Perubahan',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.nomor_perubahan}</span>
            ),
        },
        {
            accessorKey: 'perihal',
            header: 'Perihal',
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate" title={row.original.perihal}>
                    {row.original.perihal}
                </div>
            ),
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-medium text-green-600">
                    {formatRupiah(row.original.total_amount)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status =
                    typeof row.original.status === 'string'
                        ? row.original.status
                        : row.original.status;
                return (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPerubahanAnggaranStatusColor(status)}`}
                    >
                        {getPerubahanAnggaranStatusLabel(status)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'current_approval_stage',
            header: 'Tahap Saat Ini',
            cell: ({ row }) => {
                const stage = row.original.current_approval_stage;
                if (!stage) return <span className="text-gray-400">-</span>;
                return (
                    <span className="text-sm text-gray-600">
                        {typeof stage === 'string' ? getStageLabel(stage) : stage}
                    </span>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Tanggal',
            cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const item = row.original;
                const status =
                    typeof item.status === 'string' ? item.status : item.status;
                const canEdit =
                    status === PerubahanAnggaranStatus.Draft ||
                    status === PerubahanAnggaranStatus.RevisionRequired ||
                    status === 'draft' ||
                    status === 'revision-required';
                const canDelete = canEdit;

                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/perubahan-anggaran/${item.id}`)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Lihat Detail"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => navigate(`/perubahan-anggaran/${item.id}/edit`)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => setDeleteDialog({ open: true, item })}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                                title="Hapus"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    // Handlers
    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteMutation.mutateAsync(deleteDialog.item.id);
            toast.success('Perubahan anggaran berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch (err) {
            toast.error('Gagal menghapus perubahan anggaran');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-gray-600">Gagal memuat data</p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
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
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Perubahan Anggaran"
                        description="Kelola permohonan geser anggaran"
                        actions={
                            <button
                                onClick={() => navigate('/perubahan-anggaran/create')}
                                className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                Buat Permohonan
                            </button>
                        }
                    />
                </motion.div>

                {/* Search & Filter */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari nomor atau perihal..."
                    />
                </motion.div>

                {/* Table */}
                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={perubahanData}
                        emptyMessage="Belum ada data perubahan anggaran"
                    />
                </motion.div>

                {/* Delete Dialog */}
                <ConfirmDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => {
                        if (!open) setDeleteDialog({ open: false, item: null });
                    }}
                    onConfirm={handleDelete}
                    title="Hapus Perubahan Anggaran"
                    description={`Apakah Anda yakin ingin menghapus perubahan anggaran "${deleteDialog.item?.nomor_perubahan}"? Tindakan ini tidak dapat dibatalkan.`}
                    confirmLabel="Hapus"
                    variant="destructive"
                    isLoading={deleteMutation.isPending}
                />
            </motion.div>
        </PageTransition>
    );
}
