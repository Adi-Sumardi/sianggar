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
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { usePengajuanList, useDeletePengajuan } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import type { PengajuanAnggaran } from '@/types/models';
import { ProposalStatus, getStageLabel } from '@/types/enums';
import { getAcademicYearOptions } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PengajuanList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: PengajuanAnggaran | null }>({
        open: false,
        item: null,
    });

    // Fetch data from API - backend automatically filters by user's unit_id
    const { data: pengajuanResponse, isLoading, isError, error } = usePengajuanList({
        search: searchQuery || undefined,
        tahun: filterValues.tahun || undefined,
        status: filterValues.status || undefined,
    });

    const deleteMutation = useDeletePengajuan();

    // Extract and sort data - revision-required items first
    const pengajuanData = useMemo(() => {
        const data = (pengajuanResponse?.data || []) as PengajuanAnggaran[];

        // Sort: revision-required first, then by created_at desc
        return [...data].sort((a, b) => {
            const aStatus = typeof a.status_proses === 'string' ? a.status_proses : a.status_proses;
            const bStatus = typeof b.status_proses === 'string' ? b.status_proses : b.status_proses;
            const aIsRevision = aStatus === 'revision-required';
            const bIsRevision = bStatus === 'revision-required';

            if (aIsRevision && !bIsRevision) return -1;
            if (!aIsRevision && bIsRevision) return 1;

            // Same status, sort by date
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [pengajuanResponse]);

    // Count items that need revision
    const revisionCount = useMemo(() => {
        return pengajuanData.filter((item) => {
            const status = typeof item.status_proses === 'string' ? item.status_proses : item.status_proses;
            return status === 'revision-required';
        }).length;
    }, [pengajuanData]);

    // Filters - no unit filter needed (backend auto-filters)
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
                { value: 'revision-required', label: 'Perlu Revisi' },
                { value: 'approved-level-1', label: 'Approved Level 1' },
                { value: 'approved-level-2', label: 'Approved Level 2' },
                { value: 'approved-level-3', label: 'Approved Level 3' },
                { value: 'final-approved', label: 'Final Approved' },
                { value: 'done', label: 'Done' },
                { value: 'paid', label: 'Paid' },
                { value: 'rejected', label: 'Rejected' },
            ],
        },
    ];

    const columns: ColumnDef<PengajuanAnggaran, unknown>[] = [
        {
            accessorKey: 'nomor_pengajuan',
            header: 'No Surat',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.nomor_pengajuan || row.original.no_surat || '-'}</span>
            ),
        },
        {
            accessorKey: 'nama_pengajuan',
            header: 'Perihal',
            cell: ({ row }) => (
                <span className="max-w-[250px] truncate block">{row.original.nama_pengajuan || row.original.perihal}</span>
            ),
        },
        {
            accessorKey: 'jumlah_pengajuan_total',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-medium">{formatRupiah(row.original.jumlah_pengajuan_total)}</span>
            ),
        },
        {
            accessorKey: 'status_proses',
            header: 'Status',
            cell: ({ row }) => {
                const status = typeof row.original.status_proses === 'string'
                    ? row.original.status_proses
                    : row.original.status_proses;
                return <StatusBadge status={status} />;
            },
        },
        {
            accessorKey: 'current_approval_stage',
            header: 'Tahap Saat Ini',
            cell: ({ row }) => {
                const stage = row.original.current_approval_stage;
                if (!stage) return <span className="text-slate-400 text-xs">-</span>;
                return (
                    <span className="text-slate-500 text-xs">{getStageLabel(stage as string)}</span>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Tanggal',
            cell: ({ row }) => (
                <span className="text-slate-500">{formatDate(row.original.created_at)}</span>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => {
                const status = typeof row.original.status_proses === 'string'
                    ? row.original.status_proses
                    : row.original.status_proses;
                const isRevisionRequired = status === 'revision-required';
                const isDraft = status === 'draft';

                return (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pengajuan/${row.original.id}`);
                            }}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Lihat detail"
                        >
                            <Eye className="h-4 w-4" />
                        </button>

                        {/* Revisi button - only for revision-required status */}
                        {isRevisionRequired && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/pengajuan/${row.original.id}/revise`);
                                }}
                                className="rounded p-1.5 text-orange-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                title="Revisi pengajuan"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        )}

                        {/* Edit & Delete - only for draft status */}
                        {isDraft && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/pengajuan/${row.original.id}/edit`);
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
            toast.success(`Pengajuan "${deleteDialog.item.nama_pengajuan || deleteDialog.item.perihal}" berhasil dihapus`);
            setDeleteDialog({ open: false, item: null });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus pengajuan');
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
                        {error instanceof Error ? error.message : 'Gagal memuat data pengajuan'}
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
                        title="Pengajuan Anggaran"
                        description="Kelola pengajuan anggaran unit Anda"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/pengajuan/create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Buat Pengajuan
                            </button>
                        }
                    />
                </motion.div>

                {/* Revision Alert Banner */}
                {revisionCount > 0 && (
                    <motion.div variants={staggerItem} className="mb-4">
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        {revisionCount} Pengajuan Perlu Revisi
                                    </p>
                                    <p className="text-xs text-orange-600">
                                        Segera perbaiki pengajuan yang memerlukan revisi untuk melanjutkan proses approval
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
                        searchPlaceholder="Cari pengajuan..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={pengajuanData}
                        searchValue={searchQuery}
                        onRowClick={(row) => navigate(`/pengajuan/${row.id}`)}
                        emptyTitle="Belum ada pengajuan"
                        emptyDescription="Klik 'Buat Pengajuan' untuk membuat pengajuan anggaran baru."
                    />
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => {
                    if (!open) setDeleteDialog({ open: false, item: null });
                }}
                title="Hapus Pengajuan"
                description={`Apakah Anda yakin ingin menghapus pengajuan "${deleteDialog.item?.nama_pengajuan || deleteDialog.item?.perihal || ''}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </PageTransition>
    );
}
