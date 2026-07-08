import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen, ListChecks, ScrollText, Plus, Trash2, Pencil, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useUnitsList } from '@/hooks/useUnits';
import {
    useAccounts,
    useCreateAccount,
    useDeleteAccount,
    useJournalEntries,
    useReverseJournalEntry,
    useGeneralLedger,
} from '@/hooks/useLedger';
import { UserRole } from '@/types/enums';
import type { Account, JournalEntry } from '@/types/models';

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabKey = 'coa' | 'jurnal' | 'buku-besar';

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'coa', label: 'Chart of Accounts', icon: <ListChecks className="h-4 w-4" /> },
    { key: 'jurnal', label: 'Jurnal Umum', icon: <ScrollText className="h-4 w-4" /> },
    { key: 'buku-besar', label: 'Buku Besar', icon: <BookOpen className="h-4 w-4" /> },
];

const ACCOUNT_TIPE_OPTIONS = [
    { value: 'aset', label: 'Aset' },
    { value: 'kewajiban', label: 'Kewajiban' },
    { value: 'ekuitas', label: 'Ekuitas' },
    { value: 'pendapatan', label: 'Pendapatan' },
    { value: 'beban', label: 'Beban' },
];

const selectClass =
    'rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BukuBesar() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.Admin;
    const canManage = isAdmin || user?.permissions?.includes('manage-budget');
    const [activeTab, setActiveTab] = useState<TabKey>('coa');

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Buku Besar"
                        description="Chart of Accounts, jurnal umum, dan mutasi buku besar per akun & unit."
                    />
                </motion.div>

                <motion.div variants={staggerItem} className="border-b border-slate-200">
                    <nav className="-mb-px flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                                    activeTab === tab.key
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700',
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </motion.div>

                <motion.div variants={staggerItem}>
                    {activeTab === 'coa' && <ChartOfAccountsTab canManage={!!canManage} />}
                    {activeTab === 'jurnal' && <JurnalUmumTab canManage={!!canManage} />}
                    {activeTab === 'buku-besar' && <BukuBesarReportTab />}
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Tab 1: Chart of Accounts
// ---------------------------------------------------------------------------

function ChartOfAccountsTab({ canManage }: { canManage: boolean }) {
    const { data, isLoading } = useAccounts();
    const createMutation = useCreateAccount();
    const deleteMutation = useDeleteAccount();
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
    const [form, setForm] = useState({ kode: '', nama: '', tipe: 'beban', saldo_normal: 'debit' });

    const accounts = data?.data ?? [];

    const handleCreate = () => {
        if (!form.kode || !form.nama) {
            toast.error('Kode dan nama akun wajib diisi');
            return;
        }
        createMutation.mutate(form, {
            onSuccess: () => {
                toast.success('Akun berhasil dibuat');
                setShowForm(false);
                setForm({ kode: '', nama: '', tipe: 'beban', saldo_normal: 'debit' });
            },
            onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membuat akun'),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
                toast.success('Akun berhasil dihapus');
                setDeleteTarget(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Gagal menghapus akun');
                setDeleteTarget(null);
            },
        });
    };

    const columns = useMemo<ColumnDef<Account>[]>(
        () => [
            { accessorKey: 'kode', header: 'Kode' },
            { accessorKey: 'nama', header: 'Nama Akun' },
            {
                accessorKey: 'tipe',
                header: 'Tipe',
                cell: ({ row }) => <span className="capitalize">{row.original.tipe}</span>,
            },
            {
                accessorKey: 'saldo_normal',
                header: 'Saldo Normal',
                cell: ({ row }) => <span className="capitalize">{row.original.saldo_normal}</span>,
            },
            {
                accessorKey: 'unit',
                header: 'Unit',
                cell: ({ row }) => row.original.unit?.nama ?? <span className="text-slate-400">—</span>,
            },
            {
                accessorKey: 'is_postable',
                header: 'Postable',
                cell: ({ row }) => (row.original.is_postable ? 'Ya' : 'Tidak (header)'),
            },
            ...(canManage
                ? [
                      {
                          id: 'actions',
                          header: 'Aksi',
                          cell: ({ row }: { row: { original: Account } }) => (
                              <button
                                  onClick={() => setDeleteTarget(row.original)}
                                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                  title="Hapus akun"
                              >
                                  <Trash2 className="h-4 w-4" />
                              </button>
                          ),
                      } as ColumnDef<Account>,
                  ]
                : []),
        ],
        [canManage],
    );

    return (
        <div className="space-y-4">
            {canManage && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowForm((s) => !s)}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" /> Tambah Akun
                    </button>
                </div>
            )}

            {showForm && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                        <input
                            placeholder="Kode"
                            value={form.kode}
                            onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                            placeholder="Nama Akun"
                            value={form.nama}
                            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                        />
                        <select
                            value={form.tipe}
                            onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value }))}
                            className={selectClass}
                        >
                            {ACCOUNT_TIPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={form.saldo_normal}
                            onChange={(e) => setForm((f) => ({ ...f, saldo_normal: e.target.value }))}
                            className={selectClass}
                        >
                            <option value="debit">Debit</option>
                            <option value="kredit">Kredit</option>
                        </select>
                        <button
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            <DataTable columns={columns} data={accounts} isLoading={isLoading} searchPlaceholder="Cari akun..." />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus Akun"
                description={`Yakin ingin menghapus akun "${deleteTarget?.nama}"?`}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tab 2: Jurnal Umum
// ---------------------------------------------------------------------------

function JurnalUmumTab({ canManage }: { canManage: boolean }) {
    const { data: unitsList } = useUnitsList();
    const [unitId, setUnitId] = useState<number | undefined>();
    const [status, setStatus] = useState<string | undefined>();
    const [selected, setSelected] = useState<JournalEntry | null>(null);
    const reverseMutation = useReverseJournalEntry();

    const { data, isLoading } = useJournalEntries({ unit_id: unitId, status });
    const entries = data?.data ?? [];

    const handleReverse = (entry: JournalEntry) => {
        reverseMutation.mutate(
            { id: entry.id },
            {
                onSuccess: () => toast.success('Jurnal pembalik berhasil dibuat'),
                onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membalik jurnal'),
            },
        );
    };

    const columns = useMemo<ColumnDef<JournalEntry>[]>(
        () => [
            { accessorKey: 'tanggal', header: 'Tanggal', cell: ({ row }) => formatDate(row.original.tanggal) },
            { accessorKey: 'no_bukti', header: 'No. Bukti', cell: ({ row }) => row.original.no_bukti ?? '—' },
            { accessorKey: 'unit', header: 'Unit', cell: ({ row }) => row.original.unit?.nama ?? '—' },
            {
                accessorKey: 'total_debit',
                header: 'Total',
                cell: ({ row }) => formatRupiah(row.original.total_debit ?? 0),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            row.original.status === 'posted' && 'bg-green-100 text-green-700',
                            row.original.status === 'reversed' && 'bg-amber-100 text-amber-700',
                            row.original.status === 'draft' && 'bg-slate-100 text-slate-700',
                        )}
                    >
                        {row.original.status_label}
                    </span>
                ),
            },
            ...(canManage
                ? [
                      {
                          id: 'actions',
                          header: 'Aksi',
                          cell: ({ row }: { row: { original: JournalEntry } }) =>
                              row.original.status === 'posted' ? (
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleReverse(row.original);
                                      }}
                                      className="flex items-center gap-1 rounded p-1.5 text-amber-600 hover:bg-amber-50"
                                      title="Balik jurnal"
                                  >
                                      <Undo2 className="h-4 w-4" />
                                  </button>
                              ) : null,
                      } as ColumnDef<JournalEntry>,
                  ]
                : []),
        ],
        [canManage],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={unitId ?? ''}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                >
                    <option value="">Semua Unit</option>
                    {unitsList?.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                            {unit.nama}
                        </option>
                    ))}
                </select>
                <select
                    value={status ?? ''}
                    onChange={(e) => setStatus(e.target.value || undefined)}
                    className={selectClass}
                >
                    <option value="">Semua Status</option>
                    <option value="posted">Terposting</option>
                    <option value="reversed">Dibalik</option>
                </select>
            </div>

            <DataTable
                columns={columns}
                data={entries}
                isLoading={isLoading}
                onRowClick={(row) => setSelected(row)}
                searchPlaceholder="Cari jurnal..."
            />

            {selected && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-blue-700">
                            Detail Jurnal — {selected.keterangan}
                        </h4>
                        <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:underline">
                            Tutup
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500">
                                <th className="pb-2">Akun</th>
                                <th className="pb-2 text-right">Debit</th>
                                <th className="pb-2 text-right">Kredit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selected.items?.map((item) => (
                                <tr key={item.id} className="border-t border-blue-100">
                                    <td className="py-2">
                                        {item.account?.kode} — {item.account?.nama}
                                    </td>
                                    <td className="py-2 text-right">{item.debit > 0 ? formatRupiah(item.debit) : '—'}</td>
                                    <td className="py-2 text-right">{item.kredit > 0 ? formatRupiah(item.kredit) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tab 3: Buku Besar report
// ---------------------------------------------------------------------------

function BukuBesarReportTab() {
    const { data: accountsData } = useAccounts();
    const { data: unitsList } = useUnitsList();
    const currentYear = new Date().getFullYear().toString();
    const [accountId, setAccountId] = useState<number | undefined>();
    const [unitId, setUnitId] = useState<number | undefined>();
    const [tahun, setTahun] = useState(currentYear);

    const postableAccounts = (accountsData?.data ?? []).filter((a) => a.is_postable);

    const params = accountId ? { account_id: accountId, unit_id: unitId, tahun } : null;
    const { data: report, isLoading } = useGeneralLedger(params);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={accountId ?? ''}
                    onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                >
                    <option value="">Pilih Akun...</option>
                    {postableAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.kode} — {acc.nama}
                        </option>
                    ))}
                </select>
                <select
                    value={unitId ?? ''}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                >
                    <option value="">Semua Unit</option>
                    {unitsList?.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                            {unit.nama}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    placeholder="Tahun"
                    className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {!accountId && (
                <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Pilih akun untuk menampilkan mutasi buku besar.
                </p>
            )}

            {accountId && isLoading && (
                <p className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">Memuat...</p>
            )}

            {report && (
                <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs text-slate-500">Saldo Awal</p>
                            <p className="text-lg font-bold text-slate-800">{formatRupiah(report.saldo_awal)}</p>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs text-blue-600">Saldo Akhir</p>
                            <p className="text-lg font-bold text-blue-700">{formatRupiah(report.saldo_akhir)}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs text-slate-500">
                                    <th className="px-4 py-2">Tanggal</th>
                                    <th className="px-4 py-2">No. Bukti</th>
                                    <th className="px-4 py-2">Keterangan</th>
                                    <th className="px-4 py-2 text-right">Debit</th>
                                    <th className="px-4 py-2 text-right">Kredit</th>
                                    <th className="px-4 py-2 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.mutasi.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                            Belum ada mutasi pada periode ini.
                                        </td>
                                    </tr>
                                )}
                                {report.mutasi.map((m, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-4 py-2">{formatDate(m.tanggal)}</td>
                                        <td className="px-4 py-2">{m.no_bukti ?? '—'}</td>
                                        <td className="px-4 py-2">{m.keterangan ?? '—'}</td>
                                        <td className="px-4 py-2 text-right">{m.debit > 0 ? formatRupiah(m.debit) : '—'}</td>
                                        <td className="px-4 py-2 text-right">{m.kredit > 0 ? formatRupiah(m.kredit) : '—'}</td>
                                        <td className="px-4 py-2 text-right font-medium">{formatRupiah(m.saldo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
