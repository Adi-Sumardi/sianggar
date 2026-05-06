import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Save, X, Pencil, DollarSign, Loader2, Printer, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem, cardHover } from '@/lib/animations';
import { formatRupiah, formatVolume } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchFilter } from '@/components/common/SearchFilter';
import { StatCard } from '@/components/common/StatCard';
import { useApbsList, useUpdateApbs, useCreateApbs, useMataAnggarans, useSubMataAnggarans, useDetailMataAnggarans } from '@/hooks/useBudget';
import { useUnitsList } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';
import { getAcademicYearOptions } from '@/stores/authStore';
import type { Apbs } from '@/types/models';

// ---------------------------------------------------------------------------
// Extended type for display
// ---------------------------------------------------------------------------

interface ApbsWithUnit extends Omit<Apbs, 'unit'> {
    unit?: {
        id: number;
        nama: string;
        kode?: string;
    };
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const yearOptions = getAcademicYearOptions().map((y) => ({ value: y, label: `TA ${y}` }));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApbsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [expandedApbs, setExpandedApbs] = useState<Set<number>>(new Set());
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch data from API - backend automatically filters by user's unit_id
    const { data: apbsResponse, isLoading, isError, error } = useApbsList({
        search: searchQuery || undefined,
        tahun: filterValues.tahun || undefined,
        // Note: unit_id filter is handled automatically by backend based on user role
    });

    const updateMutation = useUpdateApbs();

    // Extract data from paginated response
    const apbsData = (apbsResponse?.data || []) as ApbsWithUnit[];

    // Total
    const totalApbs = apbsData.reduce((sum, item) => sum + (item.total_anggaran || 0), 0);

    // Toggle APBS expand
    const toggleApbsExpand = useCallback((id: number) => {
        setExpandedApbs((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Inline edit
    const startEdit = useCallback((row: ApbsWithUnit) => {
        setEditingId(row.id);
        setEditValue(row.total_anggaran.toString());
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingId(null);
        setEditValue('');
    }, []);

    const saveEdit = useCallback(async () => {
        if (editingId === null) return;
        const numeric = parseInt(editValue.replace(/\D/g, ''), 10) || 0;

        try {
            await updateMutation.mutateAsync({
                id: editingId,
                dto: { total_anggaran: numeric },
            });
            toast.success('Jumlah APBS berhasil diperbarui');
            setEditingId(null);
            setEditValue('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui APBS');
        }
    }, [editingId, editValue, updateMutation]);

    // Format input value
    const formatInput = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
                        {error instanceof Error ? error.message : 'Gagal memuat data APBS'}
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
                        title="APBS"
                        description="Anggaran Pendapatan dan Belanja Sekolah."
                        actions={
                            isAdmin ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah APBS
                                </button>
                            ) : undefined
                        }
                    />
                </motion.div>

                {/* Filters */}
                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={[
                            {
                                key: 'tahun',
                                label: 'Semua Tahun',
                                type: 'select',
                                options: yearOptions,
                            },
                        ]}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari unit..."
                    />
                </motion.div>

                {/* Summary Card */}
                <motion.div variants={staggerItem}>
                    <StatCard
                        title="Total APBS"
                        value={formatRupiah(totalApbs)}
                        icon={<DollarSign className="h-5 w-5" />}
                        description={`${apbsData.length} item anggaran`}
                    />
                </motion.div>

                {/* APBS Cards with Expandable Mata Anggaran */}
                <motion.div variants={staggerItem} className="space-y-4">
                    {apbsData.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
                            <p className="text-sm text-slate-500">Tidak ada data APBS ditemukan.</p>
                        </div>
                    ) : (
                        apbsData.map((apbs) => {
                            const isExpanded = expandedApbs.has(apbs.id);
                            return (
                                <motion.div
                                    key={apbs.id}
                                    {...cardHover}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                >
                                    {/* APBS Header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleApbsExpand(apbs.id)}
                                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-5 w-5" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5" />
                                                )}
                                            </button>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {apbs.unit?.nama ?? 'Unit tidak ditemukan'}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Tahun: {apbs.tahun}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Anggaran</p>
                                                {editingId === apbs.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative">
                                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs font-medium text-slate-500">
                                                                Rp
                                                            </span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={formatInput(editValue)}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEdit();
                                                                    if (e.key === 'Escape') cancelEdit();
                                                                }}
                                                                autoFocus
                                                                className="w-40 rounded-md border border-blue-400 bg-white py-1.5 pl-7 pr-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={saveEdit}
                                                            disabled={updateMutation.isPending}
                                                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                                            aria-label="Simpan"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="rounded p-1 text-slate-400 hover:bg-slate-100"
                                                            aria-label="Batal"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-base font-bold text-slate-900">
                                                            {formatRupiah(apbs.total_anggaran ?? 0)}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEdit(apbs);
                                                            }}
                                                            className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                            aria-label="Edit jumlah"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Realisasi</p>
                                                <p className="text-sm font-medium text-slate-700">
                                                    {formatRupiah(apbs.total_realisasi ?? 0)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Sisa</p>
                                                <p className="text-sm font-bold text-emerald-700">
                                                    {formatRupiah(apbs.sisa_anggaran ?? 0)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/budget/apbs/${apbs.id}`)}
                                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                title="Lihat Pengesahan"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Mata Anggaran List */}
                                    {isExpanded && (
                                        <ApbsMataAnggaranList unitId={apbs.unit_id} tahun={apbs.tahun} />
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>

                {/* Summary footer */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-800">
                                Total Keseluruhan
                            </span>
                            <span className="text-lg font-bold text-blue-900">
                                {formatRupiah(totalApbs)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Create APBS Modal */}
            {showCreateModal && (
                <CreateApbsModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Create APBS Modal
// ---------------------------------------------------------------------------

function CreateApbsModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateApbs();
    const { data: unitsList = [] } = useUnitsList();
    const [unitId, setUnitId] = useState('');
    const [tahun, setTahun] = useState('');
    const [totalAnggaran, setTotalAnggaran] = useState('');

    const handleSubmit = () => {
        if (!unitId || !tahun || !totalAnggaran) {
            toast.error('Semua field wajib diisi');
            return;
        }
        createMutation.mutate(
            { unit_id: Number(unitId), tahun, total_anggaran: Number(totalAnggaran.replace(/\D/g, '')) },
            {
                onSuccess: () => { toast.success('APBS berhasil ditambahkan'); onClose(); },
                onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan APBS'),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Tambah APBS</h3>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
                        <select
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Pilih Unit</option>
                            {unitsList.map((u) => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Tahun</label>
                        <input
                            type="text"
                            value={tahun}
                            onChange={(e) => setTahun(e.target.value)}
                            placeholder="contoh: 2025/2026"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Total Anggaran</label>
                        <input
                            type="text"
                            value={totalAnggaran}
                            onChange={(e) => setTotalAnggaran(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={createMutation.isPending} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={createMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                        {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// APBS Mata Anggaran List (expanded content)
// ---------------------------------------------------------------------------

interface ApbsMataAnggaranListProps {
    unitId: number;
    tahun: string;
}

function ApbsMataAnggaranList({ unitId, tahun }: ApbsMataAnggaranListProps) {
    const [expandedMa, setExpandedMa] = useState<Set<number>>(new Set());

    // Fetch mata anggarans for this unit
    const {
        data: mataAnggaransResponse,
        isLoading,
        isError,
    } = useMataAnggarans({ unit_id: unitId, tahun, per_page: 100 });

    const mataAnggarans = mataAnggaransResponse?.data || [];

    const toggleMaExpand = (id: number) => {
        setExpandedMa((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (isError) {
        return (
            <div className="px-5 py-4 text-sm text-red-500">
                Gagal memuat data mata anggaran
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-5 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">Memuat mata anggaran...</span>
            </div>
        );
    }

    if (mataAnggarans.length === 0) {
        return (
            <div className="px-5 py-4 text-sm text-slate-500">
                Tidak ada mata anggaran untuk unit ini.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                        <th className="w-10 px-3 py-2.5" />
                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Kode
                        </th>
                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Mata Anggaran
                        </th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Anggaran
                        </th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Realisasi
                        </th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Sisa
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {mataAnggarans.map((ma) => (
                        <ApbsMataAnggaranRow
                            key={ma.id}
                            ma={ma}
                            isExpanded={expandedMa.has(ma.id)}
                            onToggle={() => toggleMaExpand(ma.id)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Mata Anggaran Row with expandable Sub Mata Anggaran
// ---------------------------------------------------------------------------

interface ApbsMataAnggaranRowProps {
    ma: {
        id: number;
        kode: string;
        nama: string;
        jumlah?: number | null;
        realisasi?: number | null;
        sisa?: number | null;
    };
    isExpanded: boolean;
    onToggle: () => void;
}

function ApbsMataAnggaranRow({ ma, isExpanded, onToggle }: ApbsMataAnggaranRowProps) {
    const [expandedSub, setExpandedSub] = useState<Set<number>>(new Set());

    // Fetch sub mata anggarans when expanded
    const {
        data: subMataAnggaransResponse,
        isLoading: isLoadingSubs,
        isError: isSubsError,
    } = useSubMataAnggarans(isExpanded ? ma.id : null, { per_page: 100 });

    const subs = subMataAnggaransResponse?.data || [];

    const toggleSubExpand = (id: number) => {
        setExpandedSub((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <>
            <tr className="hover:bg-slate-50/50">
                <td className="px-3 py-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle();
                        }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-blue-600">
                    {ma.kode}
                </td>
                <td className="px-5 py-3 text-slate-700">
                    {ma.nama}
                </td>
                <td className="px-5 py-3 text-right font-medium text-slate-900">
                    {formatRupiah(ma.jumlah ?? 0)}
                </td>
                <td className="px-5 py-3 text-right text-slate-700">
                    {formatRupiah(ma.realisasi ?? 0)}
                </td>
                <td className="px-5 py-3 text-right font-medium text-emerald-700">
                    {formatRupiah(ma.sisa ?? (ma.jumlah ?? 0) - (ma.realisasi ?? 0))}
                </td>
            </tr>

            {/* Expanded Sub Mata Anggaran */}
            {isExpanded && (
                <tr className="bg-slate-50/30">
                    <td colSpan={6} className="px-0 py-0">
                        <div className="py-3 pl-12 pr-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sub Mata Anggaran
                            </p>
                            {isSubsError ? (
                                <div className="py-4 text-sm text-red-500">
                                    Gagal memuat sub mata anggaran
                                </div>
                            ) : isLoadingSubs ? (
                                <div className="flex items-center gap-2 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-slate-500">Memuat...</span>
                                </div>
                            ) : subs.length === 0 ? (
                                <div className="py-4 text-sm text-slate-500">
                                    Tidak ada sub mata anggaran.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {subs.map((sub) => (
                                        <ApbsSubMataAnggaranRow
                                            key={sub.id}
                                            sub={sub}
                                            mataAnggaranId={ma.id}
                                            isExpanded={expandedSub.has(sub.id)}
                                            onToggle={() => toggleSubExpand(sub.id)}
                                        />
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

// ---------------------------------------------------------------------------
// Sub Mata Anggaran Row with expandable Detail Mata Anggaran
// ---------------------------------------------------------------------------

interface ApbsSubMataAnggaranRowProps {
    sub: {
        id: number;
        kode: string;
        nama: string;
        jumlah?: number | null;
    };
    mataAnggaranId: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function ApbsSubMataAnggaranRow({ sub, mataAnggaranId, isExpanded, onToggle }: ApbsSubMataAnggaranRowProps) {
    // Fetch detail mata anggarans when expanded
    const {
        data: detailMataAnggaransResponse,
        isLoading: isLoadingDetails,
        isError: isDetailsError,
    } = useDetailMataAnggarans(
        isExpanded ? { mata_anggaran_id: mataAnggaranId, sub_mata_anggaran_id: sub.id, per_page: 100 } : null
    );

    const details = detailMataAnggaransResponse?.data || [];

    return (
        <div className="rounded-md border border-slate-200 bg-white">
            <div
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                onClick={onToggle}
            >
                <button
                    type="button"
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                    )}
                </button>
                <span className="font-mono text-xs font-medium text-blue-600">
                    {sub.kode}
                </span>
                <span className="flex-1 text-sm text-slate-700">
                    {sub.nama}
                </span>
                {sub.jumlah && (
                    <span className="text-sm font-medium text-slate-700">
                        {formatRupiah(Number(sub.jumlah))}
                    </span>
                )}
            </div>

            {/* Expanded Detail Mata Anggaran */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Detail Mata Anggaran
                    </p>
                    {isDetailsError ? (
                        <div className="py-2 text-sm text-red-500">
                            Gagal memuat detail
                        </div>
                    ) : isLoadingDetails ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-500">Memuat...</span>
                        </div>
                    ) : details.length === 0 ? (
                        <div className="py-2 text-sm text-slate-500">
                            Tidak ada detail mata anggaran.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {details.map((detail) => (
                                <div
                                    key={detail.id}
                                    className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2"
                                >
                                    <span className="font-mono text-xs font-medium text-emerald-600">
                                        {detail.kode ?? '-'}
                                    </span>
                                    <span className="flex-1 text-sm text-slate-700">
                                        {detail.nama ?? '-'}
                                    </span>
                                    {detail.volume && detail.satuan && (
                                        <span className="text-xs text-slate-500">
                                            {formatVolume(detail.volume)} {detail.satuan}
                                        </span>
                                    )}
                                    {detail.harga_satuan && (
                                        <span className="text-xs text-slate-500">
                                            @ {formatRupiah(Number(detail.harga_satuan))}
                                        </span>
                                    )}
                                    {detail.jumlah && (
                                        <span className="text-xs font-medium text-slate-700">
                                            {formatRupiah(Number(detail.jumlah))}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
