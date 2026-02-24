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
    useProkers,
    useCreateProker,
    useUpdateProker,
    useDeleteProker,
} from '@/hooks/usePlanning';
import { useUnitsList } from '@/hooks/useUnits';
import { UserRole } from '@/types/enums';
import type { Proker } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProkerRow {
    id: number;
    kode: string;
    nama: string;
    strategy_id: number;
    indikator_id: number;
    unit_nama: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProkerList() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;

    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<ProkerRow | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: ProkerRow | null }>({ open: false, item: null });

    const [formKode, setFormKode] = useState('');
    const [formNama, setFormNama] = useState('');
    const [formStrategyId, setFormStrategyId] = useState('');
    const [formIndikatorId, setFormIndikatorId] = useState('');

    // Fetch data from API
    const { data: strategiesData } = useStrategies();
    const { data: unitsData } = useUnitsList();
    const { data: indikatorsData } = useIndikators({
        strategy_id: formStrategyId ? Number(formStrategyId) : undefined,
    });
    const { data: prokersData, isLoading, isError } = useProkers({
        strategy_id: filterValues.strategy ? Number(filterValues.strategy) : undefined,
        unit_id: filterValues.unit ? Number(filterValues.unit) : undefined,
        per_page: 100,
    });
    const createProker = useCreateProker();
    const updateProker = useUpdateProker();
    const deleteProker = useDeleteProker();

    // Build options for filters and form
    const strategyOptions = useMemo(() => {
        return (strategiesData?.data || []).map((s) => ({
            value: String(s.id),
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
        return (indikatorsData?.data || []).map((i) => ({
            value: String(i.id),
            label: `${i.kode} - ${i.nama}`,
        }));
    }, [indikatorsData]);

    // Transform API data to table format
    const tableData: ProkerRow[] = useMemo(() => {
        return (prokersData?.data || []).map((proker: Proker) => ({
            id: proker.id,
            kode: proker.kode,
            nama: proker.nama,
            strategy_id: proker.strategy_id,
            indikator_id: proker.indikator_id,
            unit_nama: proker.unit?.nama || '-',
        }));
    }, [prokersData]);

    const filters = [
        { key: 'strategy', label: 'Semua Strategi', type: 'select' as const, options: strategyOptions },
        ...(isAdmin ? [{ key: 'unit', label: 'Semua Unit', type: 'select' as const, options: unitOptions }] : []),
    ];

    const openCreate = () => {
        setEditItem(null);
        setFormKode('');
        setFormNama('');
        setFormStrategyId('');
        setFormIndikatorId('');
        setDialogOpen(true);
    };

    const openEdit = (item: ProkerRow) => {
        setEditItem(item);
        setFormKode(item.kode);
        setFormNama(item.nama);
        setFormStrategyId(item.strategy_id.toString());
        setFormIndikatorId(item.indikator_id.toString());
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formKode.trim() || !formNama.trim() || !formStrategyId || !formIndikatorId) {
            toast.error('Semua field wajib diisi');
            return;
        }

        try {
            if (editItem) {
                await updateProker.mutateAsync({
                    id: editItem.id,
                    dto: {
                        strategy_id: Number(formStrategyId),
                        indikator_id: Number(formIndikatorId),
                        kode: formKode.trim(),
                        nama: formNama.trim(),
                    },
                });
                toast.success('Program kerja berhasil diperbarui');
            } else {
                await createProker.mutateAsync({
                    strategy_id: Number(formStrategyId),
                    indikator_id: Number(formIndikatorId),
                    kode: formKode.trim(),
                    nama: formNama.trim(),
                });
                toast.success('Program kerja berhasil ditambahkan');
            }
            setDialogOpen(false);
        } catch {
            toast.error(editItem ? 'Gagal memperbarui program kerja' : 'Gagal menambahkan program kerja');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        try {
            await deleteProker.mutateAsync(deleteDialog.item.id);
            toast.success('Program kerja berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch {
            toast.error('Gagal menghapus program kerja');
        }
    };

    const isSaving = createProker.isPending || updateProker.isPending;
    const isDeleting = deleteProker.isPending;

    const columns: ColumnDef<ProkerRow, unknown>[] = [
        {
            accessorKey: 'kode',
            header: 'Kode',
            cell: ({ row }) => <span className="font-medium text-blue-600">{row.original.kode}</span>,
        },
        {
            accessorKey: 'nama',
            header: 'Nama Program Kerja',
        },
        ...(isAdmin ? [{
            accessorKey: 'unit_nama',
            header: 'Unit',
            cell: ({ row }: { row: { original: ProkerRow } }) => (
                <span className="text-xs text-slate-500">{row.original.unit_nama}</span>
            ),
        } as ColumnDef<ProkerRow, unknown>] : []),
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row.original); }} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600" title="Edit">
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, item: row.original }); }} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
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
                    <p className="text-sm text-red-600">Gagal memuat data program kerja</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Program Kerja"
                        description="Kelola program kerja berdasarkan arah strategis"
                        actions={
                            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                                <Plus className="h-4 w-4" />
                                Tambah Proker
                            </button>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter filters={filters} values={filterValues} onChange={setFilterValues} onSearch={setSearchQuery} searchPlaceholder="Cari program kerja..." className="mb-4" />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <DataTable columns={columns} data={tableData} searchValue={searchQuery} emptyTitle="Belum ada program kerja" emptyDescription="Klik 'Tambah Proker' untuk menambahkan." />
                </motion.div>
            </motion.div>

            <ConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editItem ? 'Edit Program Kerja' : 'Tambah Program Kerja'} description={editItem ? 'Ubah data program kerja.' : 'Tambahkan program kerja baru.'} confirmLabel={isSaving ? 'Menyimpan...' : (editItem ? 'Simpan' : 'Tambah')} onConfirm={handleSave} loading={isSaving}>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Strategi</label>
                        <select value={formStrategyId} onChange={(e) => { setFormStrategyId(e.target.value); setFormIndikatorId(''); }} disabled={isSaving} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50">
                            <option value="">Pilih strategi</option>
                            {strategyOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Indikator</label>
                        <select value={formIndikatorId} onChange={(e) => setFormIndikatorId(e.target.value)} disabled={isSaving || !formStrategyId} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50">
                            <option value="">{formStrategyId ? 'Pilih indikator' : 'Pilih strategi terlebih dahulu'}</option>
                            {indikatorOptions.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Kode</label>
                        <input type="text" value={formKode} onChange={(e) => setFormKode(e.target.value)} placeholder="Contoh: 1.2.3" disabled={isSaving} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Program Kerja</label>
                        <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Nama program kerja" disabled={isSaving} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" />
                    </div>
                </div>
            </ConfirmDialog>

            <ConfirmDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })} title="Hapus Program Kerja" description={`Apakah Anda yakin ingin menghapus "${deleteDialog.item?.nama ?? ''}"?`} confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'} variant="destructive" onConfirm={handleDelete} loading={isDeleting} />
        </PageTransition>
    );
}
