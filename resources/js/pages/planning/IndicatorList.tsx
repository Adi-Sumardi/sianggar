import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import {
    useStrategies,
    useIndikators,
    useCreateIndikator,
    useUpdateIndikator,
    useDeleteIndikator,
} from '@/hooks/usePlanning';
import { UserRole } from '@/types/enums';
import type { Indikator } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IndicatorRow {
    id: number;
    kode: string;
    nama: string;
    strategy_id: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IndicatorList() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;

    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<IndicatorRow | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: IndicatorRow | null }>({
        open: false,
        item: null,
    });
    const [formKode, setFormKode] = useState('');
    const [formNama, setFormNama] = useState('');
    const [formStrategyId, setFormStrategyId] = useState('');

    // Fetch data from API
    const { data: strategiesData } = useStrategies();
    const { data: indikatorsData, isLoading, isError } = useIndikators({
        strategy_id: filterValues.strategy ? Number(filterValues.strategy) : undefined,
        per_page: 500,
    });
    const createIndikator = useCreateIndikator();
    const updateIndikator = useUpdateIndikator();
    const deleteIndikator = useDeleteIndikator();

    // Build strategy options for filter and form
    const strategyOptions = useMemo(() => {
        return (strategiesData?.data || []).map((s) => ({
            value: String(s.id),
            label: `${s.kode} - ${s.nama}`,
        }));
    }, [strategiesData]);

    // Transform API data to table format
    const tableData: IndicatorRow[] = useMemo(() => {
        return (indikatorsData?.data || []).map((indikator: Indikator) => ({
            id: indikator.id,
            kode: indikator.kode,
            nama: indikator.nama,
            strategy_id: indikator.strategy_id,
        }));
    }, [indikatorsData]);

    const filters = [
        {
            key: 'strategy',
            label: 'Semua Strategi',
            type: 'select' as const,
            options: strategyOptions,
        },
    ];

    const openCreate = () => {
        setEditItem(null);
        setFormKode('');
        setFormNama('');
        setFormStrategyId('');
        setDialogOpen(true);
    };

    const openEdit = (item: IndicatorRow) => {
        setEditItem(item);
        setFormKode(item.kode);
        setFormNama(item.nama);
        setFormStrategyId(item.strategy_id.toString());
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formKode.trim() || !formNama.trim() || !formStrategyId) {
            toast.error('Semua field wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateIndikator.mutateAsync({
                    id: editItem.id,
                    dto: {
                        strategy_id: Number(formStrategyId),
                        kode: formKode.trim(),
                        nama: formNama.trim(),
                    },
                });
                toast.success('Indikator berhasil diperbarui');
            } else {
                await createIndikator.mutateAsync({
                    strategy_id: Number(formStrategyId),
                    kode: formKode.trim(),
                    nama: formNama.trim(),
                });
                toast.success('Indikator berhasil ditambahkan');
            }
            setDialogOpen(false);
        } catch (error) {
            toast.error(editItem ? 'Gagal memperbarui indikator' : 'Gagal menambahkan indikator');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteIndikator.mutateAsync(deleteDialog.item.id);
            toast.success('Indikator berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch (error) {
            toast.error('Gagal menghapus indikator');
        }
    };

    const isSaving = createIndikator.isPending || updateIndikator.isPending;
    const isDeleting = deleteIndikator.isPending;

    const columns: ColumnDef<IndicatorRow, unknown>[] = [
        {
            accessorKey: 'kode',
            header: 'Kode',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.kode}</span>
            ),
        },
        {
            accessorKey: 'nama',
            header: 'Nama Indikator',
            cell: ({ row }) => (
                <span className="text-slate-700">{row.original.nama}</span>
            ),
        },
        ...(isAdmin ? [{
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }: { row: { original: IndicatorRow } }) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEdit(row.original);
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
                </div>
            ),
        } as ColumnDef<IndicatorRow, unknown>] : []),
    ];

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
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50">
                    <p className="text-sm text-red-600">Gagal memuat data indikator kinerja utama</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Indikator Kinerja Utama"
                        description="Kelola indikator kinerja utama per sasaran strategis"
                        actions={isAdmin ? (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Indikator
                            </button>
                        ) : undefined}
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari indikator..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={tableData}
                        searchValue={searchQuery}
                        emptyTitle="Belum ada indikator"
                        emptyDescription="Klik 'Tambah Indikator' untuk menambahkan indikator kinerja utama."
                    />
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Indikator' : 'Tambah Indikator'}
                description={editItem ? 'Ubah data indikator kinerja utama.' : 'Tambahkan indikator kinerja utama baru.'}
                confirmLabel={isSaving ? 'Menyimpan...' : (editItem ? 'Simpan' : 'Tambah')}
                onConfirm={handleSave}
                isLoading={isSaving}
            >
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Strategi</label>
                        <select
                            value={formStrategyId}
                            onChange={(e) => setFormStrategyId(e.target.value)}
                            disabled={isSaving}
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        >
                            <option value="">Pilih strategi</option>
                            {strategyOptions.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Kode</label>
                        <input
                            type="text"
                            value={formKode}
                            onChange={(e) => setFormKode(e.target.value)}
                            placeholder="Contoh: IK-01.01"
                            disabled={isSaving}
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Indikator</label>
                        <input
                            type="text"
                            value={formNama}
                            onChange={(e) => setFormNama(e.target.value)}
                            placeholder="Nama indikator kinerja utama"
                            disabled={isSaving}
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
                    </div>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
                title="Hapus Indikator"
                description={`Apakah Anda yakin ingin menghapus "${deleteDialog.item?.nama ?? ''}"?`}
                confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </PageTransition>
    );
}
