import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Eye, ChevronDown, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchFilter } from '@/components/common/SearchFilter';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useMataAnggarans, useDeleteMataAnggaran, useSubMataAnggarans } from '@/hooks/useBudget';
import { useUnitsList } from '@/hooks/useUnits';
import { useAuth } from '@/hooks/useAuth';
import { getAcademicYearOptions } from '@/stores/authStore';
import { UserRole, isApproverRole } from '@/types/enums';
import type { MataAnggaran, SubMataAnggaran } from '@/types/models';

// ---------------------------------------------------------------------------
// Extended type for display
// ---------------------------------------------------------------------------

interface MataAnggaranWithSubs extends MataAnggaran {
    sub_mata_anggarans?: SubMataAnggaran[];
    sub_mata_anggarans_count?: number;
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const yearOptions = getAcademicYearOptions().map((y) => ({ value: y, label: `TA ${y}` }));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MataAnggaranList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [deleteItem, setDeleteItem] = useState<MataAnggaranWithSubs | null>(null);

    const showUnitFilter = user?.role === UserRole.Admin || (user?.role && isApproverRole(user.role as UserRole));
    const { data: units } = useUnitsList();

    const filters = useMemo(() => {
        const f: Array<{ key: string; label: string; type: 'select'; options: Array<{ value: string; label: string }> }> = [];
        if (showUnitFilter) {
            f.push({
                key: 'unit_id',
                label: 'Semua Unit',
                type: 'select',
                options: units?.map((u) => ({ value: String(u.id), label: u.nama })) || [],
            });
        }
        f.push({
            key: 'tahun',
            label: 'Semua Tahun',
            type: 'select',
            options: yearOptions,
        });
        return f;
    }, [showUnitFilter, units]);

    // Fetch data from API - backend automatically filters by user's unit_id
    const { data: mataAnggaransResponse, isLoading, isError, error } = useMataAnggarans({
        search: searchQuery || undefined,
        tahun: filterValues.tahun || undefined,
        unit_id: filterValues.unit_id ? Number(filterValues.unit_id) : undefined,
    });

    const deleteMutation = useDeleteMataAnggaran();

    // Extract data from paginated response
    const mataAnggarans = (mataAnggaransResponse?.data || []) as MataAnggaranWithSubs[];

    // Toggle row expansion
    const toggleExpand = (id: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDelete = async () => {
        if (!deleteItem) return;

        try {
            await deleteMutation.mutateAsync(deleteItem.id);
            toast.success(`Mata Anggaran "${deleteItem.nama}" berhasil dihapus`);
            setDeleteItem(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus mata anggaran');
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
                        {error instanceof Error ? error.message : 'Gagal memuat data mata anggaran'}
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
                        title="Mata Anggaran"
                        description="Kelola mata anggaran dan sub mata anggaran per unit."
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/budget/mata-anggaran/create')}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Mata Anggaran
                            </button>
                        }
                    />
                </motion.div>

                {/* Search & Filters */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari kode atau nama mata anggaran..."
                    />
                </motion.div>

                {/* Stats */}
                <motion.div variants={staggerItem} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{mataAnggarans.length}</span> mata anggaran ditemukan
                    </span>
                </motion.div>

                {/* Table with expandable rows */}
                <motion.div variants={staggerItem}>
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {/* Table header */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="w-10 px-4 py-3" />
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Kode
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Nama
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Unit
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Tahun
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Jumlah Sub
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mataAnggarans.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                                                Tidak ada data mata anggaran ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        mataAnggarans.map((item) => {
                                            const isExpanded = expandedRows.has(item.id);
                                            return (
                                                <MataAnggaranRow
                                                    key={item.id}
                                                    item={item}
                                                    isExpanded={isExpanded}
                                                    onToggle={() => toggleExpand(item.id)}
                                                    onView={() => navigate(`/budget/mata-anggaran/${item.id}`)}
                                                    onEdit={() => navigate(`/budget/mata-anggaran/${item.id}/edit`)}
                                                    onDelete={() => setDeleteItem(item)}
                                                />
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteItem}
                    onOpenChange={(open) => {
                        if (!open) setDeleteItem(null);
                    }}
                    title="Hapus Mata Anggaran"
                    description={`Apakah Anda yakin ingin menghapus mata anggaran "${deleteItem?.nama}"? Seluruh sub mata anggaran terkait juga akan dihapus.`}
                    confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                    cancelLabel="Batal"
                    variant="destructive"
                    onConfirm={handleDelete}
                />
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Row component with expandable sub items
// ---------------------------------------------------------------------------

interface MataAnggaranRowProps {
    item: MataAnggaranWithSubs;
    isExpanded: boolean;
    onToggle: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function MataAnggaranRow({ item, isExpanded, onToggle, onView, onEdit, onDelete }: MataAnggaranRowProps) {
    const subCount = item.sub_mata_anggarans_count ?? item.sub_mata_anggarans?.length ?? 0;

    // Fetch sub mata anggarans when expanded
    const {
        data: subMataAnggaransResponse,
        isLoading: isLoadingSubs,
        isError: isSubsError,
        error: subsError,
    } = useSubMataAnggarans(
        isExpanded ? item.id : null,
        { per_page: 100 }
    );

    // Use fetched data or fallback to pre-loaded data
    const subs = subMataAnggaransResponse?.data || item.sub_mata_anggarans || [];

    return (
        <>
            <tr className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle();
                        }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label={isExpanded ? 'Tutup sub mata anggaran' : 'Lihat sub mata anggaran'}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">
                    {item.kode}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.nama}</td>
                <td className="px-4 py-3 text-slate-600">{item.unit?.nama ?? '-'}</td>
                <td className="px-4 py-3 text-slate-600">{item.tahun ?? '-'}</td>
                <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {subCount} sub
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onView}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            aria-label="Lihat detail"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onEdit}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            aria-label="Edit"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Hapus"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded sub items - using simple conditional rendering */}
            {isExpanded && (
                <tr key={`expanded-${item.id}`} className="bg-slate-50/50">
                    <td colSpan={7} className="px-4 py-0">
                        <div className="py-3 pl-10">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sub Mata Anggaran
                            </p>
                            {isSubsError ? (
                                <div className="py-4 text-sm text-red-500">
                                    Error: {subsError instanceof Error ? subsError.message : 'Gagal memuat sub mata anggaran'}
                                </div>
                            ) : isLoadingSubs ? (
                                <div className="flex items-center gap-2 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-slate-500">Memuat sub mata anggaran...</span>
                                </div>
                            ) : subs.length === 0 ? (
                                <div className="py-4 text-sm text-slate-500">
                                    Tidak ada sub mata anggaran.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {subs.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-4 py-2.5"
                                        >
                                            <span className="font-mono text-xs font-medium text-blue-600">
                                                {sub.kode}
                                            </span>
                                            <span className="flex-1 text-sm text-slate-700">
                                                {sub.nama}
                                            </span>
                                            {sub.unit && (
                                                <span className="text-xs text-slate-500">
                                                    {sub.unit.nama}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
