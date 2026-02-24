import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Building, Users, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { DataTable } from '@/components/common/DataTable';
import { SearchFilter } from '@/components/common/SearchFilter';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useUnits';
import type { Unit } from '@/types/models';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Unit | null>(null);
    const [deleteItem, setDeleteItem] = useState<Unit | null>(null);
    const [formKode, setFormKode] = useState('');
    const [formNama, setFormNama] = useState('');

    // Fetch units
    const { data, isLoading, isFetching } = useUnits({
        search: searchQuery || undefined,
        page,
        per_page: 15,
    });

    const units = data?.data ?? [];
    const pagination = data?.meta;

    // Mutations
    const createUnit = useCreateUnit();
    const updateUnit = useUpdateUnit();
    const deleteUnit = useDeleteUnit();

    const isSubmitting = createUnit.isPending || updateUnit.isPending;

    // Open create dialog
    const openCreate = () => {
        setEditItem(null);
        setFormKode('');
        setFormNama('');
        setDialogOpen(true);
    };

    // Open edit dialog
    const openEdit = (item: Unit) => {
        setEditItem(item);
        setFormKode(item.kode);
        setFormNama(item.nama);
        setDialogOpen(true);
    };

    // Handle save (create or update)
    const handleSave = async () => {
        if (!formKode.trim()) {
            toast.error('Kode unit wajib diisi');
            return;
        }
        if (!formNama.trim()) {
            toast.error('Nama unit wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateUnit.mutateAsync({
                    id: editItem.id,
                    dto: { kode: formKode.trim(), nama: formNama.trim() },
                });
                toast.success('Unit berhasil diperbarui');
            } else {
                await createUnit.mutateAsync({
                    kode: formKode.trim(),
                    nama: formNama.trim(),
                });
                toast.success('Unit berhasil ditambahkan');
            }
            setDialogOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Terjadi kesalahan');
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteItem) return;

        try {
            await deleteUnit.mutateAsync(deleteItem.id);
            toast.success(`Unit "${deleteItem.nama}" berhasil dihapus`);
            setDeleteItem(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menghapus unit');
        }
    };

    // Table columns
    const columns: ColumnDef<Unit, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'kode',
                header: 'Kode',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Building className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-900">
                            {row.original.kode}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'nama',
                header: 'Nama Unit',
                cell: ({ getValue }) => (
                    <span className="font-medium text-slate-700">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'users_count',
                header: 'Pengguna',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700">
                            {row.original.users_count ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'mata_anggarans_count',
                header: 'Mata Anggaran',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-slate-400" />
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-700">
                            {row.original.mata_anggarans_count ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
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
                                setDeleteItem(row.original);
                            }}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    );

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
                        title="Kelola Unit"
                        description="Kelola daftar unit organisasi dalam sistem SIANGGAR."
                        actions={
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Unit
                            </button>
                        }
                    />
                </motion.div>

                {/* Search */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={[]}
                        values={{}}
                        onChange={() => {}}
                        onSearch={(q) => {
                            setSearchQuery(q);
                            setPage(1);
                        }}
                        searchPlaceholder="Cari kode atau nama unit..."
                    />
                </motion.div>

                {/* Stats */}
                <motion.div variants={staggerItem} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Building className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-600">
                        {isLoading ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <span className="font-semibold text-slate-900">
                                    {pagination?.total ?? units.length}
                                </span>{' '}
                                unit ditemukan
                            </>
                        )}
                    </span>
                    {isFetching && !isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                </motion.div>

                {/* Table */}
                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={units}
                        isLoading={isLoading}
                        onRowClick={openEdit}
                        emptyTitle="Belum ada unit"
                        emptyDescription="Klik 'Tambah Unit' untuk menambahkan unit baru."
                        pagination={
                            pagination
                                ? {
                                      currentPage: pagination.current_page,
                                      totalPages: pagination.last_page,
                                      perPage: pagination.per_page,
                                      total: pagination.total,
                                      onPageChange: setPage,
                                  }
                                : undefined
                        }
                    />
                </motion.div>
            </motion.div>

            {/* Create/Edit Dialog */}
            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Unit' : 'Tambah Unit'}
                description={editItem ? 'Ubah data unit.' : 'Tambahkan unit baru ke sistem.'}
                confirmLabel={isSubmitting ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                onConfirm={handleSave}
                isLoading={isSubmitting}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Kode Unit <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formKode}
                            onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                            placeholder="Contoh: SD, SMP, SMA"
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Kode singkat untuk identifikasi unit
                        </p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nama Unit <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formNama}
                            onChange={(e) => setFormNama(e.target.value)}
                            placeholder="Contoh: SD Al-Azhar"
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => {
                    if (!open) setDeleteItem(null);
                }}
                title="Hapus Unit"
                description={`Apakah Anda yakin ingin menghapus unit "${deleteItem?.nama}"?${
                    ((deleteItem?.users_count ?? 0) > 0 || (deleteItem?.mata_anggarans_count ?? 0) > 0)
                        ? ` Unit ini memiliki ${deleteItem?.users_count ?? 0} pengguna dan ${deleteItem?.mata_anggarans_count ?? 0} mata anggaran terkait.`
                        : ''
                }`}
                confirmLabel={deleteUnit.isPending ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteUnit.isPending}
            />
        </PageTransition>
    );
}
