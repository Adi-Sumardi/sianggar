import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { useStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy } from '@/hooks/usePlanning';
import { UserRole } from '@/types/enums';
import type { Strategy } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StrategyRow {
    id: number;
    kode: string;
    nama: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StrategyList() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<StrategyRow | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: StrategyRow | null }>({
        open: false,
        item: null,
    });
    const [formKode, setFormKode] = useState('');
    const [formNama, setFormNama] = useState('');

    // Fetch data from API
    const { data: strategiesData, isLoading, isError } = useStrategies();
    const createStrategy = useCreateStrategy();
    const updateStrategy = useUpdateStrategy();
    const deleteStrategy = useDeleteStrategy();

    // Transform API data to table format
    const tableData: StrategyRow[] = (strategiesData?.data || []).map((strategy: Strategy) => ({
        id: strategy.id,
        kode: strategy.kode,
        nama: strategy.nama,
    }));

    const openCreate = () => {
        setEditItem(null);
        setFormKode('');
        setFormNama('');
        setDialogOpen(true);
    };

    const openEdit = (item: StrategyRow) => {
        setEditItem(item);
        setFormKode(item.kode);
        setFormNama(item.nama);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formKode.trim() || !formNama.trim()) {
            toast.error('Kode dan Nama wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateStrategy.mutateAsync({
                    id: editItem.id,
                    dto: { kode: formKode.trim(), nama: formNama.trim() },
                });
                toast.success('Sasaran strategis berhasil diperbarui');
            } else {
                await createStrategy.mutateAsync({
                    kode: formKode.trim(),
                    nama: formNama.trim(),
                });
                toast.success('Sasaran strategis berhasil ditambahkan');
            }
            setDialogOpen(false);
        } catch (error) {
            toast.error(editItem ? 'Gagal memperbarui sasaran strategis' : 'Gagal menambahkan sasaran strategis');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteStrategy.mutateAsync(deleteDialog.item.id);
            toast.success('Sasaran strategis berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch (error) {
            toast.error('Gagal menghapus sasaran strategis');
        }
    };

    const isSaving = createStrategy.isPending || updateStrategy.isPending;
    const isDeleting = deleteStrategy.isPending;

    const columns: ColumnDef<StrategyRow, unknown>[] = [
        {
            accessorKey: 'kode',
            header: 'Kode',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.kode}</span>
            ),
        },
        {
            accessorKey: 'nama',
            header: 'Nama Strategi',
            cell: ({ row }) => (
                <span className="text-slate-700">{row.original.nama}</span>
            ),
        },
        ...(isAdmin ? [{
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }: { row: { original: StrategyRow } }) => (
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
        } as ColumnDef<StrategyRow, unknown>] : []),
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
                    <p className="text-sm text-red-600">Gagal memuat data sasaran strategis</p>
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
                        title="Sasaran Strategis"
                        description="Kelola sasaran strategis organisasi"
                        actions={isAdmin ? (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Strategi
                            </button>
                        ) : undefined}
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={tableData}
                        emptyTitle="Belum ada sasaran strategis"
                        emptyDescription="Klik 'Tambah Strategi' untuk menambahkan sasaran strategis."
                    />
                </motion.div>
            </motion.div>

            {/* Add/Edit dialog */}
            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Sasaran Strategis' : 'Tambah Sasaran Strategis'}
                description={editItem ? 'Ubah data sasaran strategis.' : 'Tambahkan sasaran strategis baru.'}
                confirmLabel={isSaving ? 'Menyimpan...' : (editItem ? 'Simpan' : 'Tambah')}
                onConfirm={handleSave}
                isLoading={isSaving}
            >
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Kode</label>
                        <input
                            type="text"
                            value={formKode}
                            onChange={(e) => setFormKode(e.target.value)}
                            placeholder="Contoh: AS-01"
                            disabled={isSaving}
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Strategi</label>
                        <input
                            type="text"
                            value={formNama}
                            onChange={(e) => setFormNama(e.target.value)}
                            placeholder="Nama sasaran strategis"
                            disabled={isSaving}
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Delete dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
                title="Hapus Sasaran Strategis"
                description={`Apakah Anda yakin ingin menghapus "${deleteDialog.item?.nama ?? ''}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </PageTransition>
    );
}
