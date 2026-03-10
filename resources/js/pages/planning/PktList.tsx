import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as Tooltip from '@radix-ui/react-tooltip';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';

import {
    usePkts,
    useDeletePkt,
} from '@/hooks/usePlanning';
import { useRapbsList } from '@/hooks/useRapbsApproval';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useUnitsList } from '@/hooks/useUnits';
import { RapbsStatus, UserRole } from '@/types/enums';
import type { Pkt } from '@/types/models';

// ---------------------------------------------------------------------------
// PKT Code Cell with Tooltip
// ---------------------------------------------------------------------------

interface PktCodeCellProps {
    pkt: Pkt;
}

function PktCodeCell({ pkt }: PktCodeCellProps) {
    const kegiatanKode = pkt.kegiatan?.kode || '-';
    const kegiatanNama = pkt.kegiatan?.nama || '-';

    return (
        <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <span className="cursor-help font-mono text-sm font-semibold text-blue-600 underline decoration-dotted underline-offset-2">
                        {kegiatanKode}
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
                        sideOffset={8}
                        side="bottom"
                        align="start"
                    >
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Hierarki Perencanaan
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 px-1 font-mono text-xs font-bold text-blue-700">
                                    {pkt.strategy?.kode || '-'}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-blue-700">Sasaran Strategis</p>
                                    <p className="text-sm leading-snug text-slate-700">{pkt.strategy?.nama || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 px-1 font-mono text-xs font-bold text-emerald-700">
                                    {pkt.indikator?.kode || '-'}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-emerald-700">Indikator</p>
                                    <p className="text-sm leading-snug text-slate-700">{pkt.indikator?.nama || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 px-1 font-mono text-xs font-bold text-amber-700">
                                    {pkt.proker?.kode || '-'}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-amber-700">Program Kerja</p>
                                    <p className="text-sm leading-snug text-slate-700">{pkt.proker?.nama || '-'}</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-purple-200 px-1 font-mono text-xs font-bold text-purple-700">
                                        {kegiatanKode}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-purple-700">Kegiatan</p>
                                        <p className="text-sm font-medium leading-snug text-slate-800">{kegiatanNama}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Tooltip.Arrow className="fill-white" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}

// ---------------------------------------------------------------------------
// Format Tahun Anggaran (e.g., "2026" -> "2026/2027")
// ---------------------------------------------------------------------------

function formatTahunAnggaran(tahun: string): string {
    // If already in academic year format (e.g., "2025/2026"), return as-is
    if (tahun.includes('/')) return tahun;
    // Legacy format: single year (e.g., "2026") -> convert to "2026/2027"
    const year = parseInt(tahun);
    if (isNaN(year)) return tahun;
    return `${year}/${year + 1}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PktList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Pkt | null }>({ open: false, item: null });

    // API Queries
    const { data: pktsData, isLoading: pktsLoading } = usePkts({
        tahun: filterValues.tahun || undefined,
        unit_id: filterValues.unit_id || undefined,
        per_page: 500,
    });
    const { data: unitsData } = useUnitsList();

    // Check if unit's RAPBS is locked (not draft/rejected)
    const { data: rapbsData } = useRapbsList(
        user?.unit_id ? { unit_id: user.unit_id } : undefined,
    );
    const unitRapbs = rapbsData?.data?.[0];
    const rapbsLocked = !!unitRapbs &&
        unitRapbs.status !== RapbsStatus.Draft &&
        unitRapbs.status !== RapbsStatus.Rejected;
    const rapbsApproved = !!unitRapbs && (
        unitRapbs.status === RapbsStatus.Approved ||
        unitRapbs.status === RapbsStatus.ApbsGenerated ||
        unitRapbs.status === RapbsStatus.Active
    );

    // Mutations
    const deletePkt = useDeletePkt();

    // Transform data for selects
    const unitOptions = useMemo(() => {
        return unitsData?.map((u) => ({ value: String(u.id), label: `${u.kode} - ${u.nama}` })) ?? [];
    }, [unitsData]);

    // Generate tahun anggaran filter options
    const tahunOptions = useMemo(() => {
        return getAcademicYearOptions().map((ay) => ({
            value: ay,
            label: `TA ${ay}`,
        }));
    }, []);

    const filters = [
        { key: 'tahun', label: 'Semua TA', type: 'select' as const, options: tahunOptions },
        ...(isAdmin ? [{ key: 'unit_id', label: 'Semua Unit', type: 'select' as const, options: unitOptions }] : []),
    ];

    const pkts = pktsData?.data ?? [];

    const filteredData = useMemo(() => {
        if (!searchQuery) return pkts;
        const q = searchQuery.toLowerCase();
        return pkts.filter((row) =>
            row.kegiatan?.nama?.toLowerCase().includes(q) ||
            row.proker?.nama?.toLowerCase().includes(q) ||
            row.deskripsi_kegiatan?.toLowerCase().includes(q)
        );
    }, [pkts, searchQuery]);

    const handleDelete = async () => {
        if (!deleteDialog.item) return;
        try {
            await deletePkt.mutateAsync(deleteDialog.item.id);
            toast.success('PKT berhasil dihapus');
            setDeleteDialog({ open: false, item: null });
        } catch {
            toast.error('Terjadi kesalahan saat menghapus');
        }
    };

    const columns: ColumnDef<Pkt, unknown>[] = [
        ...(isAdmin ? [{
            accessorKey: 'unit',
            header: 'Unit',
            cell: ({ row }: { row: { original: Pkt } }) => (
                <span className="font-medium text-slate-900">
                    {row.original.unit_relation?.nama || row.original.unit || '-'}
                </span>
            ),
        } as ColumnDef<Pkt, unknown>] : []),
        {
            accessorKey: 'tahun',
            header: 'TA',
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm text-slate-600">
                    {formatTahunAnggaran(row.original.tahun)}
                </span>
            ),
        },
        {
            id: 'pkt_code',
            header: 'PKT',
            cell: ({ row }) => <PktCodeCell pkt={row.original} />,
        },
        {
            accessorKey: 'mata_anggaran',
            header: 'Mata Anggaran',
            cell: ({ row }) => (
                <div>
                    <span className="text-sm text-slate-700">
                        {row.original.mata_anggaran?.nama || '-'}
                    </span>
                    {row.original.kegiatan?.nama && (
                        <p className="text-xs text-slate-400">{row.original.kegiatan.nama}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'saldo_anggaran',
            header: 'Nilai Anggaran Awal yang Diajukan',
            cell: ({ row }) => (
                <span className="font-semibold text-emerald-600">
                    {formatRupiah(row.original.saldo_anggaran)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/planning/pkt/${row.original.id}/edit`);
                        }}
                        disabled={rapbsLocked}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title={rapbsLocked ? 'RAPBS sedang diajukan' : 'Edit'}
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, item: row.original });
                        }}
                        disabled={rapbsLocked}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title={rapbsLocked ? 'RAPBS sedang diajukan' : 'Hapus'}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    const totalSaldo = useMemo(() => {
        return filteredData.reduce((s, r) => s + (r.saldo_anggaran || 0), 0);
    }, [filteredData]);

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Program Kerja Tahunan (PKT)"
                        description="Kelola program kerja tahunan dengan mata anggaran terkait"
                        actions={
                            <div className="flex items-center gap-3">
                                {rapbsLocked && (
                                    <span className={`text-xs ${rapbsApproved ? 'text-green-300' : 'text-amber-300'}`}>
                                        {rapbsApproved
                                            ? 'RAPBS sudah diapprove, pengisian PKT ditutup'
                                            : 'RAPBS sedang diajukan'}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => navigate('/planning/pkt/create')}
                                    disabled={rapbsLocked}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah PKT
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <SearchFilter
                        filters={filters}
                        values={filterValues}
                        onChange={setFilterValues}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari PKT..."
                        className="mb-4"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    {pktsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            emptyMessage="Belum ada PKT. Klik 'Tambah PKT' untuk menambahkan program kerja tahunan."
                        />
                    )}
                </motion.div>

                {/* Summary */}
                <motion.div variants={staggerItem} className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs font-medium text-blue-600">Total PKT</p>
                            <p className="text-lg font-bold text-blue-700">{filteredData.length} item</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-blue-600">Total Nilai Anggaran Awal</p>
                            <p className="text-lg font-bold text-blue-700">{formatRupiah(totalSaldo)}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
                title="Hapus PKT"
                description=""
                confirmLabel={deletePkt.isPending ? 'Menghapus...' : 'Hapus'}
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deletePkt.isPending}
            >
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                        Apakah Anda yakin ingin menghapus PKT <strong>"{deleteDialog.item?.kegiatan?.nama ?? ''}"</strong>?
                    </p>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-800">
                            Perhatian: Data RAPBS yang terkait dengan PKT ini juga akan ikut terhapus.
                        </p>
                    </div>
                </div>
            </ConfirmDialog>
        </PageTransition>
    );
}
