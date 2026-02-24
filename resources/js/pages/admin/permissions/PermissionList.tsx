import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Key, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { DataTable } from '@/components/common/DataTable';
import { SearchFilter } from '@/components/common/SearchFilter';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
    usePermissions,
    useCreatePermission,
    useUpdatePermission,
    useDeletePermission,
} from '@/hooks/usePermissions';
import type { Permission } from '@/services/permissionService';

// ---------------------------------------------------------------------------
// Core permissions that cannot be deleted or renamed
// ---------------------------------------------------------------------------
const CORE_PERMISSIONS = [
    'view-dashboard',
    'view-budget',
    'manage-budget',
    'create-proposal',
    'view-proposals',
    'approve-proposals',
    'view-reports',
    'create-lpj',
    'manage-reports',
    'view-planning',
    'manage-planning',
    'view-emails',
    'manage-emails',
    'manage-users',
    'manage-units',
    'manage-perubahan',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PermissionList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Permission | null>(null);
    const [deleteItem, setDeleteItem] = useState<Permission | null>(null);
    const [formName, setFormName] = useState('');

    // Fetch permissions
    const { data, isLoading, isFetching } = usePermissions({
        search: searchQuery || undefined,
    });

    const permissions = data?.data ?? [];
    const groupedPermissions = data?.grouped ?? [];

    // Mutations
    const createPermission = useCreatePermission();
    const updatePermission = useUpdatePermission();
    const deletePermission = useDeletePermission();

    const isSubmitting = createPermission.isPending || updatePermission.isPending;

    // Open create dialog
    const openCreate = () => {
        setEditItem(null);
        setFormName('');
        setDialogOpen(true);
    };

    // Open edit dialog
    const openEdit = (item: Permission) => {
        if (CORE_PERMISSIONS.includes(item.name)) {
            toast.error('Permission sistem tidak dapat diubah');
            return;
        }
        setEditItem(item);
        setFormName(item.name);
        setDialogOpen(true);
    };

    // Handle save (create or update)
    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Nama permission wajib diisi');
            return;
        }

        // Validate format
        const nameRegex = /^[a-z]+(-[a-z]+)*$/;
        if (!nameRegex.test(formName.trim())) {
            toast.error('Format nama tidak valid. Gunakan huruf kecil dan tanda hubung.');
            return;
        }

        try {
            if (editItem) {
                await updatePermission.mutateAsync({
                    id: editItem.id,
                    data: { name: formName.trim() },
                });
                toast.success('Permission berhasil diperbarui');
            } else {
                await createPermission.mutateAsync({
                    name: formName.trim(),
                });
                toast.success('Permission berhasil ditambahkan');
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
            await deletePermission.mutateAsync(deleteItem.id);
            toast.success(`Permission "${deleteItem.name}" berhasil dihapus`);
            setDeleteItem(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menghapus permission');
        }
    };

    // Table columns
    const columns: ColumnDef<Permission, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Permission',
                cell: ({ row }) => {
                    const isCore = CORE_PERMISSIONS.includes(row.original.name);
                    return (
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                isCore ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                                {isCore ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                            </div>
                            <div>
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                    {row.original.name}
                                </span>
                                {isCore && (
                                    <span className="ml-2 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-700">
                                        Sistem
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'guard_name',
                header: 'Guard',
                cell: ({ getValue }) => (
                    <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {getValue() as string}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) => {
                    const isCore = CORE_PERMISSIONS.includes(row.original.name);
                    if (isCore) {
                        return (
                            <span className="text-xs text-slate-400">Tidak dapat diubah</span>
                        );
                    }
                    return (
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
                    );
                },
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
                        title="Kelola Permission"
                        description="Kelola daftar permission yang tersedia dalam sistem."
                        actions={
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Permission
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
                        onSearch={(q) => setSearchQuery(q)}
                        searchPlaceholder="Cari permission..."
                    />
                </motion.div>

                {/* Stats */}
                <motion.div variants={staggerItem} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Key className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-600">
                        {isLoading ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <span className="font-semibold text-slate-900">
                                    {permissions.length}
                                </span>{' '}
                                permission ditemukan
                            </>
                        )}
                    </span>
                    {isFetching && !isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                </motion.div>

                {/* Grouped View */}
                <motion.div variants={staggerItem} className="space-y-4">
                    {groupedPermissions.map((group) => (
                        <div key={group.category} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                                <h3 className="text-sm font-semibold capitalize text-slate-700">
                                    {group.category.replace(/-/g, ' ')}
                                </h3>
                            </div>
                            <div className="p-4">
                                <DataTable
                                    columns={columns}
                                    data={group.permissions}
                                    isLoading={isLoading}
                                    onRowClick={(row) => {
                                        if (!CORE_PERMISSIONS.includes(row.name)) {
                                            openEdit(row);
                                        }
                                    }}
                                    emptyTitle="Tidak ada permission"
                                    emptyDescription="Tidak ada permission dalam kategori ini."
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Create/Edit Dialog */}
            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Permission' : 'Tambah Permission'}
                description={editItem ? 'Ubah nama permission.' : 'Tambahkan permission baru ke sistem.'}
                confirmLabel={isSubmitting ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                onConfirm={handleSave}
                isLoading={isSubmitting}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nama Permission <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                            placeholder="Contoh: view-analytics, manage-settings"
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Format: huruf kecil dengan tanda hubung (contoh: view-dashboard, manage-users)
                        </p>
                    </div>
                </div>
            </ConfirmDialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => {
                    if (!open) setDeleteItem(null);
                }}
                title="Hapus Permission"
                description={`Apakah Anda yakin ingin menghapus permission "${deleteItem?.name}"? Permission ini akan dihapus dari semua role yang menggunakannya.`}
                confirmLabel={deletePermission.isPending ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deletePermission.isPending}
            />
        </PageTransition>
    );
}
