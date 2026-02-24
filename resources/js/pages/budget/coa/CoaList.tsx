import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Building2, ArrowDownToLine, BarChart3, RefreshCw, Loader2, ChevronDown, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useCoaByUnit, useDeleteMataAnggaran, useSubMataAnggarans, useDetailMataAnggarans, usePenerimaanList, useRealisasiList, useUpdatePenerimaan, useCreateRealisasi, useUpdateRealisasi } from '@/hooks/useBudget';
import { useQueryClient } from '@tanstack/react-query';
import { usePerubahanAnggarans } from '@/hooks/usePerubahanAnggaran';
import { useUnitsList } from '@/hooks/useUnits';
import { exportCoaExcel, exportCoaPdf } from '@/services/budgetService';
import type { PenerimaanData, RealisasiData } from '@/services/budgetService';
import { UserRole } from '@/types/enums';
import type { PerubahanAnggaran } from '@/types/models';
import { getPerubahanAnggaranStatusLabel, getPerubahanAnggaranStatusColor } from '@/types/enums';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'per-unit' | 'penerimaan' | 'realisasi' | 'perubahan';

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'per-unit', label: 'Per Unit', icon: <Building2 className="h-4 w-4" /> },
    { key: 'penerimaan', label: 'Penerimaan', icon: <ArrowDownToLine className="h-4 w-4" /> },
    { key: 'realisasi', label: 'Realisasi', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'perubahan', label: 'Perubahan', icon: <RefreshCw className="h-4 w-4" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoaList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;
    const [activeTab, setActiveTab] = useState<TabKey>('per-unit');
    const [deleteItem, setDeleteItem] = useState<{ id: number; label: string } | null>(null);
    const [editingPenerimaan, setEditingPenerimaan] = useState<PenerimaanData | null>(null);
    const [editingRealisasi, setEditingRealisasi] = useState<RealisasiData | null>(null);
    const [creatingRealisasi, setCreatingRealisasi] = useState(false);
    const queryClient = useQueryClient();
    const deleteMutation = useDeleteMataAnggaran();
    const updatePenerimaanMutation = useUpdatePenerimaan();
    const updateRealisasiMutation = useUpdateRealisasi();
    const createRealisasiMutation = useCreateRealisasi();

    const handleDelete = () => {
        if (!deleteItem) return;
        deleteMutation.mutate(deleteItem.id, {
            onSuccess: () => {
                toast.success(`"${deleteItem.label}" berhasil dihapus`);
                setDeleteItem(null);
                queryClient.invalidateQueries({ queryKey: ['coa-by-unit'] });
            },
            onError: (error) => {
                const message = error instanceof Error ? error.message : 'Gagal menghapus data';
                toast.error(message);
                setDeleteItem(null);
            },
        });
    };

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
                        title="Chart of Accounts"
                        description="Kelola kode akun, penerimaan, realisasi, dan perubahan anggaran."
                    />
                </motion.div>

                {/* Tabs */}
                <motion.div variants={staggerItem}>
                    <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all',
                                    activeTab === tab.key
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900',
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'per-unit' && (
                        <PerUnitTab
                            onDelete={isAdmin ? (item) => setDeleteItem(item) : undefined}
                            onAdd={() => navigate('/budget/coa/create')}
                        />
                    )}
                    {activeTab === 'penerimaan' && (
                        <PenerimaanTab
                            onDelete={isAdmin ? (item) => setDeleteItem({ id: item.id, label: item.sumber || item.keterangan || '-' }) : undefined}
                            onEdit={isAdmin ? (item) => setEditingPenerimaan(item) : undefined}
                        />
                    )}
                    {activeTab === 'realisasi' && (
                        <RealisasiTab
                            onDelete={isAdmin ? (item) => setDeleteItem({ id: item.id, label: item.keterangan || '-' }) : undefined}
                            onEdit={isAdmin ? (item) => setEditingRealisasi(item) : undefined}
                            onCreate={isAdmin ? () => setCreatingRealisasi(true) : undefined}
                        />
                    )}
                    {activeTab === 'perubahan' && <PerubahanTab />}
                </motion.div>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteItem}
                    onOpenChange={(open) => {
                        if (!open && !deleteMutation.isPending) setDeleteItem(null);
                    }}
                    title="Hapus Data"
                    description={`Apakah Anda yakin ingin menghapus "${deleteItem?.label}"? Tindakan ini tidak dapat dibatalkan.`}
                    confirmLabel="Hapus"
                    variant="destructive"
                    isLoading={deleteMutation.isPending}
                    onConfirm={handleDelete}
                />

                {/* Edit Penerimaan Modal */}
                {editingPenerimaan && (
                    <EditFormModal
                        title="Edit Penerimaan"
                        open={!!editingPenerimaan}
                        onClose={() => setEditingPenerimaan(null)}
                        isLoading={updatePenerimaanMutation.isPending}
                        fields={[
                            { name: 'sumber', label: 'Sumber', type: 'text', defaultValue: editingPenerimaan.sumber },
                            { name: 'jumlah', label: 'Jumlah', type: 'number', defaultValue: editingPenerimaan.jumlah },
                            { name: 'bulan', label: 'Bulan', type: 'text', defaultValue: editingPenerimaan.bulan },
                            { name: 'keterangan', label: 'Keterangan', type: 'text', defaultValue: editingPenerimaan.keterangan ?? '' },
                        ]}
                        onSubmit={(values) => {
                            updatePenerimaanMutation.mutate(
                                { id: editingPenerimaan.id, dto: { sumber: values.sumber, jumlah: Number(values.jumlah), bulan: values.bulan, keterangan: values.keterangan || null } },
                                {
                                    onSuccess: () => { toast.success('Penerimaan berhasil diperbarui'); setEditingPenerimaan(null); },
                                    onError: () => toast.error('Gagal memperbarui penerimaan'),
                                },
                            );
                        }}
                    />
                )}

                {/* Edit Realisasi Modal */}
                {editingRealisasi && (
                    <EditFormModal
                        title="Edit Realisasi"
                        open={!!editingRealisasi}
                        onClose={() => setEditingRealisasi(null)}
                        isLoading={updateRealisasiMutation.isPending}
                        fields={[
                            { name: 'jumlah_anggaran', label: 'Jumlah Anggaran', type: 'number', defaultValue: editingRealisasi.jumlah_anggaran },
                            { name: 'jumlah_realisasi', label: 'Jumlah Realisasi', type: 'number', defaultValue: editingRealisasi.jumlah_realisasi },
                            { name: 'bulan', label: 'Bulan', type: 'text', defaultValue: editingRealisasi.bulan },
                            { name: 'keterangan', label: 'Keterangan', type: 'text', defaultValue: editingRealisasi.keterangan ?? '' },
                        ]}
                        onSubmit={(values) => {
                            updateRealisasiMutation.mutate(
                                { id: editingRealisasi.id, dto: { jumlah_anggaran: Number(values.jumlah_anggaran), jumlah_realisasi: Number(values.jumlah_realisasi), bulan: values.bulan, keterangan: values.keterangan || null } },
                                {
                                    onSuccess: () => { toast.success('Realisasi berhasil diperbarui'); setEditingRealisasi(null); },
                                    onError: () => toast.error('Gagal memperbarui realisasi'),
                                },
                            );
                        }}
                    />
                )}

                {/* Create Realisasi Modal */}
                {creatingRealisasi && (
                    <EditFormModal
                        title="Tambah Realisasi"
                        open={creatingRealisasi}
                        onClose={() => setCreatingRealisasi(false)}
                        isLoading={createRealisasiMutation.isPending}
                        fields={[
                            { name: 'unit_id', label: 'Unit ID', type: 'number', defaultValue: String(user?.unit_id ?? '') },
                            { name: 'tahun', label: 'Tahun', type: 'text', defaultValue: '' },
                            { name: 'bulan', label: 'Bulan', type: 'text', defaultValue: '' },
                            { name: 'jumlah_anggaran', label: 'Jumlah Anggaran', type: 'number', defaultValue: '' },
                            { name: 'jumlah_realisasi', label: 'Jumlah Realisasi', type: 'number', defaultValue: '' },
                            { name: 'keterangan', label: 'Keterangan', type: 'text', defaultValue: '' },
                        ]}
                        onSubmit={(values) => {
                            createRealisasiMutation.mutate(
                                { unit_id: Number(values.unit_id), tahun: values.tahun, bulan: values.bulan, jumlah_anggaran: Number(values.jumlah_anggaran), jumlah_realisasi: Number(values.jumlah_realisasi), keterangan: values.keterangan || null },
                                {
                                    onSuccess: () => { toast.success('Realisasi berhasil ditambahkan'); setCreatingRealisasi(false); },
                                    onError: () => toast.error('Gagal menambahkan realisasi'),
                                },
                            );
                        }}
                    />
                )}
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Simple Edit Form Modal
// ---------------------------------------------------------------------------

interface EditFormField {
    name: string;
    label: string;
    type: 'text' | 'number';
    defaultValue: string;
}

function EditFormModal({
    title,
    open,
    onClose,
    isLoading,
    fields,
    onSubmit,
}: {
    title: string;
    open: boolean;
    onClose: () => void;
    isLoading: boolean;
    fields: EditFormField[];
    onSubmit: (values: Record<string, string>) => void;
}) {
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        for (const f of fields) init[f.name] = f.defaultValue;
        return init;
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
                <div className="space-y-3">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
                            <input
                                type={field.type}
                                value={values[field.name] ?? ''}
                                onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => onSubmit(values)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Per Unit Tab
// ---------------------------------------------------------------------------

function PerUnitTab({ onDelete, onAdd }: { onDelete?: (item: { id: number; label: string }) => void; onAdd: () => void }) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;
    const isApprover = user?.role && !([UserRole.Admin] as string[]).includes(user.role) &&
        !['pg', 'ra', 'tk', 'sd', 'smp12', 'smp55', 'sma33', 'asrama', 'laz', 'litbang', 'stebank', 'staff-direktur', 'staff-sekretariat', 'sdm', 'umum', 'pembangunan'].includes(user.role);

    const [filterUnitId, setFilterUnitId] = useState<number | undefined>(undefined);

    // Only approver/admin roles can filter by unit
    const { data: unitsList } = useUnitsList();

    // Fetch data from API - backend automatically filters by user's unit_id
    const { data: coaData, isLoading, isError, error } = useCoaByUnit(
        filterUnitId ? { unit_id: filterUnitId } : undefined,
    );
    const [expandedMa, setExpandedMa] = useState<Set<number>>(new Set());
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

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

    const handleDownloadExcel = async () => {
        try {
            setIsExportingExcel(true);
            toast.info('Mengunduh file Excel...');
            const blob = await exportCoaExcel(filterUnitId ? { unit_id: filterUnitId } : undefined);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `COA_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('File Excel berhasil diunduh');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal mengunduh file Excel';
            toast.error(errorMessage);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setIsExportingPdf(true);
            toast.info('Mengunduh file PDF...');
            const blob = await exportCoaPdf(filterUnitId ? { unit_id: filterUnitId } : undefined);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `COA_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('File PDF berhasil diunduh');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal mengunduh file PDF';
            toast.error(errorMessage);
        } finally {
            setIsExportingPdf(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-sm text-red-600">
                    {error instanceof Error ? error.message : 'Gagal memuat data COA'}
                </p>
            </div>
        );
    }

    const units = coaData || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                {/* Left side - Filter unit for approver/admin */}
                <div className="flex items-center gap-2">
                    {(isAdmin || isApprover) && unitsList && (
                        <select
                            value={filterUnitId ?? ''}
                            onChange={(e) => setFilterUnitId(e.target.value ? Number(e.target.value) : undefined)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Semua Unit</option>
                            {unitsList.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.nama}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadExcel}
                        disabled={isExportingExcel}
                        className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isExportingExcel ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4" />
                        )}
                        {isExportingExcel ? 'Mengunduh...' : 'Download Excel'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isExportingPdf}
                        className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isExportingPdf ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}
                        {isExportingPdf ? 'Mengunduh...' : 'Download PDF'}
                    </button>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onAdd}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah COA
                        </button>
                    )}
                </div>
            </div>

            {units.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
                    <p className="text-sm text-slate-500">Tidak ada data COA ditemukan.</p>
                </div>
            ) : (
                units.map((unit) => (
                    <div key={unit.unit_id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-slate-900">{unit.unit_nama ?? 'Unit'}</h3>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                {unit.mata_anggarans.length} akun
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="w-10 px-3 py-2.5" />
                                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Kode
                                        </th>
                                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Nama Akun
                                        </th>
                                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Jenis
                                        </th>
                                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Sub
                                        </th>
                                        <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Total
                                        </th>
                                        {onDelete && (
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {unit.mata_anggarans.map((ma) => (
                                        <MataAnggaranCoaRow
                                            key={ma.id}
                                            ma={ma}
                                            isExpanded={expandedMa.has(ma.id)}
                                            onToggle={() => toggleMaExpand(ma.id)}
                                            onDelete={onDelete}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Mata Anggaran Row with expandable Sub Mata Anggaran
// ---------------------------------------------------------------------------

interface MataAnggaranCoaRowProps {
    ma: {
        id: number;
        kode: string;
        nama: string;
        jenis: string | null;
        sub_count: number;
        total: number;
    };
    isExpanded: boolean;
    onToggle: () => void;
    onDelete?: (item: { id: number; label: string }) => void;
}

function MataAnggaranCoaRow({ ma, isExpanded, onToggle, onDelete }: MataAnggaranCoaRowProps) {
    const navigate = useNavigate();
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
                <td className="px-5 py-3 font-mono text-xs font-medium text-blue-700">
                    {ma.kode}
                </td>
                <td className="px-5 py-3 text-slate-700">{ma.nama}</td>
                <td className="px-5 py-3 text-slate-500">{ma.jenis ?? '-'}</td>
                <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {ma.sub_count} sub
                    </span>
                </td>
                <td className="px-5 py-3 text-right font-medium text-slate-900">
                    {formatRupiah(ma.total)}
                </td>
                {onDelete && (
                    <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                            <button
                                type="button"
                                onClick={() => navigate(`/budget/mata-anggaran/${ma.id}/edit`)}
                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete({ id: ma.id, label: ma.nama })}
                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </td>
                )}
            </tr>

            {/* Expanded Sub Mata Anggaran */}
            {isExpanded && (
                <tr className="bg-slate-50/30">
                    <td colSpan={7} className="px-0 py-0">
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
                                        <SubMataAnggaranCoaRow
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

interface SubMataAnggaranCoaRowProps {
    sub: {
        id: number;
        kode: string;
        nama: string;
        unit?: { nama: string } | null;
    };
    mataAnggaranId: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function SubMataAnggaranCoaRow({ sub, mataAnggaranId, isExpanded, onToggle }: SubMataAnggaranCoaRowProps) {
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
                {sub.unit && (
                    <span className="text-xs text-slate-500">
                        {sub.unit.nama}
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
                                            {detail.volume} {detail.satuan}
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

// ---------------------------------------------------------------------------
// Penerimaan Tab - Real API data
// ---------------------------------------------------------------------------

function PenerimaanTab({ onDelete, onEdit }: { onDelete?: (item: PenerimaanData) => void; onEdit?: (item: PenerimaanData) => void }) {
    const { data: penerimaanResponse, isLoading, isError } = usePenerimaanList({ per_page: 100 });
    const penerimaanData = penerimaanResponse?.data || [];

    const columns: ColumnDef<PenerimaanData, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'unit',
                header: 'Unit',
                cell: ({ row }) => (
                    <span className="font-medium text-slate-900">{row.original.unit?.nama ?? '-'}</span>
                ),
            },
            {
                accessorKey: 'tahun',
                header: 'Tahun',
            },
            {
                accessorKey: 'bulan',
                header: 'Bulan',
                cell: ({ getValue }) => (
                    <span className="text-slate-700">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'sumber',
                header: 'Sumber',
                cell: ({ getValue }) => (
                    <span className="text-slate-700">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'jumlah',
                header: 'Jumlah',
                cell: ({ getValue }) => (
                    <span className="font-medium text-emerald-700">{formatRupiah(Number(getValue()))}</span>
                ),
            },
            {
                accessorKey: 'keterangan',
                header: 'Keterangan',
                cell: ({ getValue }) => (
                    <span className="text-slate-500">{(getValue() as string) ?? '-'}</span>
                ),
            },
            ...(onDelete ? [{
                id: 'actions' as const,
                header: 'Aksi',
                enableSorting: false,
                cell: ({ row }: { row: { original: PenerimaanData } }) => (
                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row.original);
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row.original);
                            }}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ),
            }] : []),
        ],
        [onDelete, onEdit],
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-sm text-red-600">Gagal memuat data penerimaan</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={penerimaanData}
                searchPlaceholder="Cari penerimaan..."
                emptyMessage="Tidak ada data penerimaan"
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Realisasi Tab - Real API data
// ---------------------------------------------------------------------------

function RealisasiTab({ onDelete, onEdit, onCreate }: { onDelete?: (item: RealisasiData) => void; onEdit?: (item: RealisasiData) => void; onCreate?: () => void }) {
    const { data: realisasiResponse, isLoading, isError } = useRealisasiList({ per_page: 100 });
    const realisasiData = realisasiResponse?.data || [];

    const columns: ColumnDef<RealisasiData, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'unit',
                header: 'Unit',
                cell: ({ row }) => (
                    <span className="font-medium text-slate-900">{row.original.unit?.nama ?? '-'}</span>
                ),
            },
            {
                accessorKey: 'bulan',
                header: 'Bulan',
                cell: ({ getValue }) => (
                    <span className="text-slate-700">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'jumlah_anggaran',
                header: 'Anggaran',
                cell: ({ getValue }) => (
                    <span className="text-slate-700">{formatRupiah(Number(getValue()))}</span>
                ),
            },
            {
                accessorKey: 'jumlah_realisasi',
                header: 'Realisasi',
                cell: ({ getValue }) => (
                    <span className="font-medium text-red-700">{formatRupiah(Number(getValue()))}</span>
                ),
            },
            {
                accessorKey: 'sisa',
                header: 'Sisa',
                cell: ({ getValue }) => {
                    const val = Number(getValue() ?? 0);
                    return (
                        <span className={cn('font-medium', val >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                            {formatRupiah(val)}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'persentase',
                header: '%',
                cell: ({ getValue }) => (
                    <span className="text-slate-500">{getValue() ? `${Number(getValue())}%` : '-'}</span>
                ),
            },
            {
                accessorKey: 'keterangan',
                header: 'Keterangan',
                cell: ({ getValue }) => (
                    <span className="text-slate-500">{(getValue() as string) ?? '-'}</span>
                ),
            },
            ...(onDelete ? [{
                id: 'actions' as const,
                header: 'Aksi',
                enableSorting: false,
                cell: ({ row }: { row: { original: RealisasiData } }) => (
                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row.original);
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row.original);
                            }}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ),
            }] : []),
        ],
        [onDelete, onEdit],
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-sm text-red-600">Gagal memuat data realisasi</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {onCreate && (
                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Realisasi
                    </button>
                </div>
            )}

            <DataTable
                columns={columns}
                data={realisasiData}
                searchPlaceholder="Cari realisasi..."
                emptyMessage="Tidak ada data realisasi"
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Perubahan Tab - Real API data from usePerubahanAnggarans
// ---------------------------------------------------------------------------

function PerubahanTab() {
    const { data: perubahanResponse, isLoading, isError } = usePerubahanAnggarans({ per_page: 100 });
    const perubahanData = perubahanResponse?.data || [];

    const columns: ColumnDef<PerubahanAnggaran, unknown>[] = useMemo(
        () => [
            {
                accessorKey: 'nomor_perubahan',
                header: 'No. Perubahan',
                cell: ({ getValue }) => (
                    <span className="font-mono text-xs font-medium text-blue-700">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'perihal',
                header: 'Perihal',
                cell: ({ getValue }) => (
                    <span className="font-medium text-slate-900">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'unit',
                header: 'Unit',
                cell: ({ row }) => (
                    <span className="text-slate-700">{row.original.unit?.nama ?? '-'}</span>
                ),
            },
            {
                accessorKey: 'tahun',
                header: 'Tahun',
            },
            {
                accessorKey: 'total_amount',
                header: 'Total',
                cell: ({ getValue }) => (
                    <span className="font-medium text-slate-900">{formatRupiah(getValue() as number)}</span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const status = getValue() as string;
                    return (
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', getPerubahanAnggaranStatusColor(status))}>
                            {getPerubahanAnggaranStatusLabel(status)}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'alasan',
                header: 'Alasan',
                cell: ({ getValue }) => (
                    <span className="text-slate-500">{(getValue() as string) ?? '-'}</span>
                ),
            },
        ],
        [],
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-sm text-red-600">Gagal memuat data perubahan anggaran</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={perubahanData}
                searchPlaceholder="Cari perubahan anggaran..."
                emptyMessage="Tidak ada data perubahan anggaran"
            />

            {perubahanData.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-400">Total Perubahan</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {perubahanData.length} pengajuan
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-400">Total Nominal</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {formatRupiah(perubahanData.reduce((s, r) => s + (r.total_amount ?? 0), 0))}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
