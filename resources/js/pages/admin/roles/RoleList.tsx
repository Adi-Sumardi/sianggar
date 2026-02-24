import { useState, useMemo, Fragment } from 'react';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Shield, Loader2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
    useRoleMatrix,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useSyncRolePermissions,
} from '@/hooks/useRoles';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/services/roleService';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Protected roles that cannot be deleted or renamed
// ---------------------------------------------------------------------------
const PROTECTED_ROLES = ['super-admin', 'admin'];

// ---------------------------------------------------------------------------
// Resource icons and colors for Shield-like UI
// ---------------------------------------------------------------------------
const RESOURCE_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
    'dashboard': { color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Dashboard' },
    'budget': { color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Anggaran' },
    'proposals': { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pengajuan' },
    'proposal': { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pengajuan' },
    'reports': { color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Laporan' },
    'lpj': { color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'LPJ' },
    'planning': { color: 'text-cyan-600', bgColor: 'bg-cyan-50', label: 'Perencanaan' },
    'emails': { color: 'text-pink-600', bgColor: 'bg-pink-50', label: 'Komunikasi' },
    'users': { color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Pengguna' },
    'units': { color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Unit' },
    'perubahan': { color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'Perubahan' },
    'other': { color: 'text-slate-600', bgColor: 'bg-slate-50', label: 'Lainnya' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoleList() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Role | null>(null);
    const [deleteItem, setDeleteItem] = useState<Role | null>(null);
    const [formName, setFormName] = useState('');
    const [formPermissions, setFormPermissions] = useState<string[]>([]);
    const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set(['dashboard', 'budget', 'proposals']));

    // Fetch data
    const { data: matrixData, isLoading: matrixLoading } = useRoleMatrix();
    const { data: permissionsData } = usePermissions();

    const roles = matrixData?.roles ?? [];
    const permissions = matrixData?.permissions ?? [];

    // Mutations
    const createRole = useCreateRole();
    const updateRole = useUpdateRole();
    const deleteRole = useDeleteRole();
    const syncPermissions = useSyncRolePermissions();

    const isSubmitting = createRole.isPending || updateRole.isPending;

    // Group permissions by resource (Shield-style)
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, { permissions: typeof permissions; actions: Set<string> }> = {};

        permissions.forEach((permission) => {
            const parts = permission.name.split('-');
            let resource = 'other';
            let action = permission.name;

            if (parts.length > 1) {
                action = parts[0]; // view, manage, create, approve
                resource = parts.slice(1).join('-');
            }

            if (!groups[resource]) {
                groups[resource] = { permissions: [], actions: new Set() };
            }
            groups[resource].permissions.push(permission);
            groups[resource].actions.add(action);
        });

        return groups;
    }, [permissions]);

    // Toggle resource expansion
    const toggleResource = (resource: string) => {
        setExpandedResources(prev => {
            const next = new Set(prev);
            if (next.has(resource)) {
                next.delete(resource);
            } else {
                next.add(resource);
            }
            return next;
        });
    };

    // Expand/Collapse all
    const expandAll = () => setExpandedResources(new Set(Object.keys(groupedPermissions)));
    const collapseAll = () => setExpandedResources(new Set());

    // Open create dialog
    const openCreate = () => {
        setEditItem(null);
        setFormName('');
        setFormPermissions([]);
        setDialogOpen(true);
    };

    // Open edit dialog
    const openEdit = (role: Role) => {
        setEditItem(role);
        setFormName(role.name);
        setFormPermissions(role.permissions);
        setDialogOpen(true);
    };

    // Handle save (create or update)
    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Nama role wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateRole.mutateAsync({
                    id: editItem.id,
                    data: {
                        name: formName.trim(),
                        permissions: formPermissions,
                    },
                });
                toast.success('Role berhasil diperbarui');
            } else {
                await createRole.mutateAsync({
                    name: formName.trim(),
                    permissions: formPermissions,
                });
                toast.success('Role berhasil ditambahkan');
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
            await deleteRole.mutateAsync(deleteItem.id);
            toast.success(`Role "${deleteItem.name}" berhasil dihapus`);
            setDeleteItem(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menghapus role');
        }
    };

    // Handle permission toggle
    const handlePermissionToggle = async (roleId: number, roleName: string, permissionName: string, currentPermissions: string[]) => {
        const newPermissions = currentPermissions.includes(permissionName)
            ? currentPermissions.filter((p) => p !== permissionName)
            : [...currentPermissions, permissionName];

        try {
            await syncPermissions.mutateAsync({
                id: roleId,
                data: { permissions: newPermissions },
            });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menyinkronkan permission');
        }
    };

    // Toggle all permissions for a resource for a role
    const handleToggleResourceForRole = async (roleId: number, resource: string, resourcePermissions: typeof permissions, currentRolePermissions: string[]) => {
        const resourcePermissionNames = resourcePermissions.map(p => p.name);
        const hasAll = resourcePermissionNames.every(p => currentRolePermissions.includes(p));

        let newPermissions: string[];
        if (hasAll) {
            // Remove all resource permissions
            newPermissions = currentRolePermissions.filter(p => !resourcePermissionNames.includes(p));
        } else {
            // Add all resource permissions
            newPermissions = [...new Set([...currentRolePermissions, ...resourcePermissionNames])];
        }

        try {
            await syncPermissions.mutateAsync({
                id: roleId,
                data: { permissions: newPermissions },
            });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menyinkronkan permission');
        }
    };

    // Toggle permission in form
    const toggleFormPermission = (permissionName: string) => {
        setFormPermissions((prev) =>
            prev.includes(permissionName)
                ? prev.filter((p) => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    // Get action label
    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            'view': 'Lihat',
            'manage': 'Kelola',
            'create': 'Buat',
            'approve': 'Setujui',
        };
        return labels[action] || action;
    };

    if (matrixLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                        title="Role & Permission"
                        description="Kelola role dan hak akses pengguna dalam sistem SIANGGAR."
                        actions={
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Role
                            </button>
                        }
                    />
                </motion.div>

                {/* Role Cards Header */}
                        <motion.div variants={staggerItem}>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {roles.length} Role Tersedia
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={expandAll}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Buka Semua
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={collapseAll}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Tutup Semua
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Role Header Cards */}
                            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold capitalize text-slate-900">
                                                        {role.name.replace(/-/g, ' ')}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500">
                                                        {role.permissions.length} permissions
                                                    </p>
                                                </div>
                                            </div>
                                            {!PROTECTED_ROLES.includes(role.name) && (
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(role)}
                                                        className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteItem(role)}
                                                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Permission Matrix - Shield Style */}
                        <motion.div variants={staggerItem} className="space-y-3">
                            {Object.entries(groupedPermissions).map(([resource, { permissions: resourcePermissions }]) => {
                                const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG['other'];
                                const isExpanded = expandedResources.has(resource);

                                return (
                                    <div
                                        key={resource}
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        {/* Resource Header */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleResource(resource)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleResource(resource); } }}
                                            className={cn(
                                                "flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors",
                                                config.bgColor
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm", config.color)}>
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className={cn("font-semibold", config.color)}>
                                                        {config.label}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        {resourcePermissions.length} permission{resourcePermissions.length > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Quick toggle all for each role */}
                                                <div className="hidden items-center gap-2 md:flex">
                                                    {roles.slice(0, 4).map((role) => {
                                                        const resourcePermissionNames = resourcePermissions.map(p => p.name);
                                                        const hasAll = resourcePermissionNames.every(p => role.permissions.includes(p));
                                                        const hasSome = resourcePermissionNames.some(p => role.permissions.includes(p));

                                                        return (
                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleResourceForRole(role.id, resource, resourcePermissions, role.permissions);
                                                                }}
                                                                className={cn(
                                                                    "flex h-6 min-w-[60px] items-center justify-center rounded-full px-2 text-[10px] font-medium transition-colors",
                                                                    hasAll
                                                                        ? "bg-emerald-500 text-white"
                                                                        : hasSome
                                                                        ? "bg-amber-100 text-amber-700"
                                                                        : "bg-slate-200 text-slate-500"
                                                                )}
                                                                title={`Toggle semua untuk ${role.name}`}
                                                            >
                                                                {role.name.slice(0, 8)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-5 w-5 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Permissions Grid */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-slate-50">
                                                                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                                                                    Permission
                                                                </th>
                                                                {roles.map((role) => (
                                                                    <th
                                                                        key={role.id}
                                                                        className="px-3 py-2 text-center text-xs font-semibold text-slate-600"
                                                                        style={{ minWidth: 80 }}
                                                                    >
                                                                        <span className="capitalize">{role.name.replace(/-/g, ' ')}</span>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {resourcePermissions.map((permission) => {
                                                                const parts = permission.name.split('-');
                                                                const action = parts[0];

                                                                return (
                                                                    <tr key={permission.id} className="hover:bg-slate-50/50">
                                                                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5 hover:bg-slate-50/50">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={cn(
                                                                                    "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                                                                                    action === 'view' && "bg-blue-100 text-blue-700",
                                                                                    action === 'manage' && "bg-emerald-100 text-emerald-700",
                                                                                    action === 'create' && "bg-amber-100 text-amber-700",
                                                                                    action === 'approve' && "bg-purple-100 text-purple-700",
                                                                                )}>
                                                                                    {getActionLabel(action)}
                                                                                </span>
                                                                                <span className="text-sm text-slate-700">
                                                                                    {permission.name}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        {roles.map((role) => {
                                                                            const hasPermission = role.permissions.includes(permission.name);
                                                                            return (
                                                                                <td key={`${role.id}-${permission.id}`} className="px-3 py-2.5 text-center">
                                                                                    <div className="flex justify-center">
                                                                                        <Switch
                                                                                            checked={hasPermission}
                                                                                            onCheckedChange={() =>
                                                                                                handlePermissionToggle(
                                                                                                    role.id,
                                                                                                    role.name,
                                                                                                    permission.name,
                                                                                                    role.permissions
                                                                                                )
                                                                                            }
                                                                                            disabled={syncPermissions.isPending}
                                                                                            className="data-[state=checked]:bg-emerald-500"
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </motion.div>
            </motion.div>

            {/* Create/Edit Dialog */}
            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Role' : 'Tambah Role'}
                description={editItem ? 'Ubah data role dan permissions.' : 'Tambahkan role baru ke sistem.'}
                confirmLabel={isSubmitting ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                onConfirm={handleSave}
                isLoading={isSubmitting}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nama Role <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                            placeholder="Contoh: manager, supervisor"
                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isSubmitting || !!(editItem && PROTECTED_ROLES.includes(editItem.name))}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Gunakan huruf kecil dan tanda hubung (contoh: unit-manager)
                        </p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Permissions
                        </label>
                        <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3">
                            {permissionsData?.grouped?.map((group) => (
                                <div key={group.category}>
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {group.category.replace(/-/g, ' ')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.permissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-slate-50"
                                            >
                                                <Checkbox
                                                    checked={formPermissions.includes(permission.name)}
                                                    onCheckedChange={() => toggleFormPermission(permission.name)}
                                                    disabled={isSubmitting}
                                                />
                                                <span className="text-sm text-slate-700">{permission.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ConfirmDialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => {
                    if (!open) setDeleteItem(null);
                }}
                title="Hapus Role"
                description={`Apakah Anda yakin ingin menghapus role "${deleteItem?.name}"? Semua pengguna dengan role ini akan kehilangan hak akses terkait.`}
                confirmLabel={deleteRole.isPending ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteRole.isPending}
            />
        </PageTransition>
    );
}
