import { useState, useMemo, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImportDialog } from '@/components/common/ImportDialog';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import {
    useStrategies,
    useIndikators,
    useProkers,
    useKegiatans,
    useCreateKegiatan,
    useUpdateKegiatan,
    useDeleteKegiatan,
    useImportKegiatans,
} from '@/hooks/usePlanning';
import { getKegiatanImportTemplateUrl } from '@/services/planningService';
import { useUnitsList } from '@/hooks/useUnits';
import { UserRole, isApproverRole } from '@/types/enums';
import type { Kegiatan } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityRow {
    id: number;
    kode: string;
    nama: string;
    jenis_kegiatan: 'unggulan' | 'non-unggulan';
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    unit_nama: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityList() {
    const { user } = useAuth();
    const canViewAllUnits = user?.role === UserRole.Admin || (user?.role != null && isApproverRole(user.role));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<ActivityRow | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: ActivityRow | null }>({ open: false, item: null });
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // Form state
    const [formKode, setFormKode] = useState('');
    const [formNama, setFormNama] = useState('');
    const [formStrategyId, setFormStrategyId] = useState('');
    const [formIndikatorId, setFormIndikatorId] = useState('');
    const [formProkerId, setFormProkerId] = useState('');
    const [formJenisKegiatan, setFormJenisKegiatan] = useState<'unggulan' | 'non-unggulan'>('non-unggulan');

    // Data hooks
    const { data: strategiesData, isLoading: loadingStrategies } = useStrategies();
    const { data: unitsData } = useUnitsList();
    const { data: indikatorsData } = useIndikators({
        strategy_id: formStrategyId ? Number(formStrategyId) : undefined,
    });
    const { data: prokersData } = useProkers({
        indikator_id: formIndikatorId ? Number(formIndikatorId) : undefined,
    });
    const { data: kegiatansData, isLoading: loadingKegiatans, error: kegiatansError } = useKegiatans({
        strategy_id: filterValues.strategy ? Number(filterValues.strategy) : undefined,
        proker_id: filterValues.proker ? Number(filterValues.proker) : undefined,
        unit_id: filterValues.unit ? Number(filterValues.unit) : undefined,
        jenis_kegiatan: filterValues.jenis || undefined,
        per_page: 100,
    });

    // Mutations
    const createKegiatan = useCreateKegiatan();
    const updateKegiatan = useUpdateKegiatan();
    const deleteKegiatan = useDeleteKegiatan();
    const importKegiatans = useImportKegiatans();

    // Helper to extract array from various response structures
    const extractArray = <T,>(data: unknown): T[] => {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: T[] }).data)) {
            return (data as { data: T[] }).data;
        }
        return [];
    };

    // Build dropdown options
    const strategyOptions = useMemo(() => {
        const items = extractArray<{ id: number; kode: string; nama: string }>(strategiesData);
        return items.map((s) => ({
            value: s.id.toString(),
            label: `${s.kode} - ${s.nama}`,
        }));
    }, [strategiesData]);

    const unitOptions = useMemo(() => {
        return (unitsData?.data || []).map((u) => ({
            value: String(u.id),
            label: u.nama,
        }));
    }, [unitsData]);

    const indikatorOptions = useMemo(() => {
        const items = extractArray<{ id: number; kode: string; nama: string }>(indikatorsData);
        return items.map((i) => ({
            value: i.id.toString(),
            label: `${i.kode} - ${i.nama}`,
        }));
    }, [indikatorsData]);

    const prokerOptions = useMemo(() => {
        const items = extractArray<{ id: number; kode: string; nama: string }>(prokersData);
        return items.map((p) => ({
            value: p.id.toString(),
            label: `${p.kode} - ${p.nama}`,
        }));
    }, [prokersData]);

    // All prokers for filter (not cascaded)
    const { data: allProkersData } = useProkers({ per_page: 100 });
    const allProkerOptions = useMemo(() => {
        const items = extractArray<{ id: number; kode: string; nama: string }>(allProkersData);
        return items.map((p) => ({
            value: p.id.toString(),
            label: `${p.kode} - ${p.nama}`,
        }));
    }, [allProkersData]);

    // Reset dependent fields when parent changes
    useEffect(() => {
        setFormIndikatorId('');
        setFormProkerId('');
    }, [formStrategyId]);

    useEffect(() => {
        setFormProkerId('');
    }, [formIndikatorId]);

    // Filters for SearchFilter component
    const jenisOptions = [
        { value: 'unggulan', label: 'Unggulan' },
        { value: 'non-unggulan', label: 'Prestasi' },
    ];

    const filters = [
        { key: 'strategy', label: 'Semua Strategi', type: 'select' as const, options: strategyOptions },
        { key: 'proker', label: 'Semua Proker', type: 'select' as const, options: allProkerOptions },
        { key: 'jenis', label: 'Semua Jenis', type: 'select' as const, options: jenisOptions },
        ...(canViewAllUnits ? [{ key: 'unit', label: 'Semua Unit', type: 'select' as const, options: unitOptions }] : []),
    ];

    // Transform data to table format
    const tableData: ActivityRow[] = useMemo(() => {
        const items = extractArray<Kegiatan>(kegiatansData);
        return items.map((k) => ({
            id: k.id,
            kode: k.kode ?? '-',
            nama: k.nama ?? '-',
            jenis_kegiatan: k.jenis_kegiatan ?? 'non-unggulan',
            strategy_id: k.strategy_id,
            indikator_id: k.indikator_id,
            proker_id: k.proker_id,
            unit_nama: k.unit?.nama || '-',
        }));
    }, [kegiatansData]);

    const openCreate = () => {
        setEditItem(null);
        setFormKode('');
        setFormNama('');
        setFormStrategyId('');
        setFormIndikatorId('');
        setFormProkerId('');
        setFormJenisKegiatan('non-unggulan');
        setDialogOpen(true);
    };

    const openEdit = (item: ActivityRow) => {
        setEditItem(item);
        setFormKode(item.kode);
        setFormNama(item.nama);
        setFormStrategyId(item.strategy_id.toString());
        setFormIndikatorId(item.indikator_id.toString());
        setFormProkerId(item.proker_id.toString());
        setFormJenisKegiatan(item.jenis_kegiatan);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formProkerId) {
            toast.error('Program Kerja wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateKegiatan.mutateAsync({
                    id: editItem.id,
                    dto: {
                        kode: formKode.trim() || undefined,
                        nama: formNama.trim() || undefined,
                        jenis_kegiatan: formJenisKegiatan,
                    },
                });
                toast.success('Kegiatan berhasil diperbarui');
            } else {
                if (!formStrategyId || !formIndikatorId) {
                    toast.error('Strategi, Indikator, dan Program Kerja wajib diisi');
                    return;
                }
                await createKegiatan.mutateAsync({
                    strategy_id: Number(formStrategyId),
                    indikator_id: Number(formIndikatorId),
                    proker_id: Number(formProkerId),
                    kode: formKode.trim() || undefined,
                    nama: formNama.trim() || undefined,
                    jenis_kegiatan: formJenisKegiatan,
                });
                toast.success('Kegiatan berhasil ditambahkan');
            }
            setDialogOpen(false);
        } catch {
            toast.error(editItem ? 'Gagal memperbarui kegiatan' : 'Gagal menambahkan kegiatan');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteKegiatan.mutateAsync(deleteDialog.item.id);
            toast.success('Kegiatan berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch {
            toast.error('Gagal menghapus kegiatan');
        }
    };

    const isSaving = createKegiatan.isPending || updateKegiatan.isPending;
    const isDeleting = deleteKegiatan.isPending;

    const columns: ColumnDef<ActivityRow, unknown>[] = [
        {
            accessorKey: 'kode',
            header: 'Kode',
            cell: ({ row }) => <span className="font-medium text-blue-600">{row.original.kode}</span>,
        },
        {
            accessorKey: 'nama',
            header: 'Nama Kegiatan',
        },
        {
            accessorKey: 'jenis_kegiatan',
            header: 'Unggulan',
            cell: ({ row }) => (
                row.original.jenis_kegiatan === 'unggulan'
                    ? <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Unggulan</span>
                    : <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Prestasi</span>
            ),
        },
        ...(canViewAllUnits ? [{
            accessorKey: 'unit_nama',
            header: 'Unit',
            cell: ({ row }: { row: { original: ActivityRow } }) => (
                <span className="text-xs text-slate-500">{row.original.unit_nama}</span>
            ),
        } as ColumnDef<ActivityRow, unknown>] : []),
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row.original); }} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, item: row.original }); }} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Hapus"><Trash2 className="h-4 w-4" /></button>
                </div>
            ),
        },
    ];

    // Loading state
    if (loadingKegiatans || loadingStrategies) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (kegiatansError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50">
                    <p className="text-sm text-red-600">Gagal memuat data kegiatan</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Kegiatan"
                        description="Kelola kegiatan per program kerja"
                        actions={
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setImportDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                                    <Upload className="h-4 w-4" />
                                    Import
                                </button>
                                <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                                    <Plus className="h-4 w-4" />
                                    Tambah Kegiatan
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter filters={filters} values={filterValues} onChange={setFilterValues} onSearch={setSearchQuery} searchPlaceholder="Cari kegiatan..." className="mb-4" />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable columns={columns} data={tableData} searchValue={searchQuery} emptyTitle="Belum ada kegiatan" emptyDescription="Klik 'Tambah Kegiatan' untuk menambahkan kegiatan baru." />
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editItem ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                description={editItem ? 'Ubah data kegiatan.' : 'Tambahkan kegiatan baru.'}
                confirmLabel={isSaving ? 'Menyimpan...' : (editItem ? 'Simpan' : 'Tambah')}
                onConfirm={handleSave}
                confirmDisabled={isSaving}
            >
                <div className="space-y-3">
                    {!editItem && (
                        <>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Sasaran Strategis</label>
                                <select value={formStrategyId} onChange={(e) => setFormStrategyId(e.target.value)} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                    <option value="">Pilih strategi</option>
                                    {strategyOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Indikator</label>
                                <select value={formIndikatorId} onChange={(e) => setFormIndikatorId(e.target.value)} disabled={!formStrategyId} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400">
                                    <option value="">{formStrategyId ? 'Pilih indikator' : 'Pilih strategi terlebih dahulu'}</option>
                                    {indikatorOptions.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Program Kerja</label>
                                <select value={formProkerId} onChange={(e) => setFormProkerId(e.target.value)} disabled={!formIndikatorId} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400">
                                    <option value="">{formIndikatorId ? 'Pilih proker' : 'Pilih indikator terlebih dahulu'}</option>
                                    {prokerOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Kode</label>
                        <input type="text" value={formKode} onChange={(e) => setFormKode(e.target.value)} placeholder="Contoh: 1.2.3.4" className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Kegiatan</label>
                        <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Nama kegiatan" className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Kegiatan</label>
                        <select value={formJenisKegiatan} onChange={(e) => setFormJenisKegiatan(e.target.value as 'unggulan' | 'non-unggulan')} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="non-unggulan">Prestasi</option>
                            <option value="unggulan">Unggulan</option>
                        </select>
                    </div>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
                title="Hapus Kegiatan"
                description={`Apakah Anda yakin ingin menghapus "${deleteDialog.item?.nama ?? ''}"?`}
                confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                confirmDisabled={isDeleting}
            />

            <ImportDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                title="Import Kegiatan"
                templateUrl={getKegiatanImportTemplateUrl()}
                templateFileName="template-import-kegiatan.xlsx"
                onImport={(file) => importKegiatans.mutateAsync(file)}
            />
        </PageTransition>
    );
}
