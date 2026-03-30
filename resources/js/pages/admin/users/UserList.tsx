import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchFilter } from '@/components/common/SearchFilter';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UserRole, getRoleLabel } from '@/types/enums';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import type { User } from '@/services/userService';

// ---------------------------------------------------------------------------
// Role filter options
// ---------------------------------------------------------------------------

const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: getRoleLabel(role),
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteUserData, setDeleteUserData] = useState<User | null>(null);

    // Fetch users from API
    const { data: usersResponse, isLoading, isError, error } = useUsers({
        search: searchQuery || undefined,
        role: filterValues.role || undefined,
        per_page: 100,
    });

    const deleteUserMutation = useDeleteUser();

    const users = usersResponse?.data ?? [];

    // Table columns
    const columns: ColumnDef<User, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Nama',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {row.original.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">
                            {row.original.name}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ getValue }) => (
                    <span className="text-slate-600">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'no_hp',
                header: 'No HP',
                cell: ({ row }) => (
                    <span className="text-slate-600">{row.original.no_hp ?? '-'}</span>
                ),
            },
            {
                accessorKey: 'role',
                header: 'Role',
                cell: ({ row }) => (
                    <StatusBadge status={row.original.role_label || getRoleLabel(row.original.role as UserRole)} />
                ),
            },
            {
                id: 'unit',
                header: 'Unit',
                cell: ({ row }) => (
                    <span className="text-slate-600">
                        {row.original.unit?.nama ?? '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'created_at',
                header: 'Tanggal Dibuat',
                cell: ({ getValue }) => {
                    const date = new Date(getValue() as string);
                    return (
                        <span className="text-slate-500">
                            {date.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: 'Aksi',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/users/${row.original.id}/edit`);
                            }}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`Edit ${row.original.name}`}
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteUserData(row.original);
                            }}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Hapus ${row.original.name}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [navigate],
    );

    const handleDelete = () => {
        if (!deleteUserData) return;

        deleteUserMutation.mutate(deleteUserData.id, {
            onSuccess: () => {
                toast.success(`Pengguna "${deleteUserData.name}" berhasil dihapus`);
                setDeleteUserData(null);
            },
            onError: (err: Error) => {
                toast.error(err.message || 'Gagal menghapus pengguna');
            },
        });
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (isError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data pengguna'}
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
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Kelola Pengguna"
                        description="Kelola seluruh akun pengguna sistem SIANGGAR."
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/admin/users/create')}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Pengguna
                            </button>
                        }
                    />
                </motion.div>

                {/* Search & Filters */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={[
                            {
                                key: 'role',
                                label: 'Semua Role',
                                type: 'select',
                                options: roleOptions,
                            },
                        ]}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari nama atau email..."
                    />
                </motion.div>

                {/* Stats row */}
                <motion.div variants={staggerItem} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Users className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{users.length}</span> pengguna ditemukan
                    </span>
                </motion.div>

                {/* Table */}
                <motion.div variants={staggerItem}>
                    <DataTable
                        columns={columns}
                        data={users}
                        onRowClick={(user) => navigate(`/admin/users/${user.id}/edit`)}
                        searchPlaceholder="Cari pengguna..."
                        emptyMessage="Tidak ada pengguna ditemukan"
                    />
                </motion.div>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteUserData}
                    onOpenChange={(open) => {
                        if (!open) setDeleteUserData(null);
                    }}
                    title="Hapus Pengguna"
                    description={`Apakah Anda yakin ingin menghapus pengguna "${deleteUserData?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                    confirmLabel="Hapus"
                    cancelLabel="Batal"
                    variant="destructive"
                    onConfirm={handleDelete}
                    isLoading={deleteUserMutation.isPending}
                />
            </motion.div>
        </PageTransition>
    );
}
