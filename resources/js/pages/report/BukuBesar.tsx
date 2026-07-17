import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    BookOpen,
    ListChecks,
    ScrollText,
    Plus,
    Trash2,
    Pencil,
    Undo2,
    Redo2,
    Wallet,
    Scale,
    FileBarChart,
    X,
} from 'lucide-react';
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
import { useAuthStore } from '@/stores/authStore';
import { useUnitsList } from '@/hooks/useUnits';
import {
    useAccounts,
    useCreateAccount,
    useUpdateAccount,
    useDeleteAccount,
    useJournalEntries,
    useReverseJournalEntry,
    useCancelReversal,
    useCreateManualEntry,
    useGeneralLedger,
    useUnitLedger,
    useTrialBalance,
    useIncomeStatement,
    useBalanceSheet,
} from '@/hooks/useLedger';
import { UserRole } from '@/types/enums';
import type { Account, JournalEntry } from '@/types/models';

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabKey = 'coa' | 'jurnal' | 'buku-besar' | 'rekening-unit' | 'neraca-saldo' | 'laporan-keuangan';

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'coa', label: 'Chart of Accounts', icon: <ListChecks className="h-4 w-4" /> },
    { key: 'jurnal', label: 'Jurnal Umum', icon: <ScrollText className="h-4 w-4" /> },
    { key: 'buku-besar', label: 'Buku Besar', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'rekening-unit', label: 'Rekening Unit', icon: <Wallet className="h-4 w-4" /> },
    { key: 'neraca-saldo', label: 'Neraca Saldo', icon: <Scale className="h-4 w-4" /> },
    { key: 'laporan-keuangan', label: 'Neraca & Laba Rugi', icon: <FileBarChart className="h-4 w-4" /> },
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
                    {activeTab === 'rekening-unit' && <RekeningUnitTab />}
                    {activeTab === 'neraca-saldo' && <NeracaSaldoTab />}
                    {activeTab === 'laporan-keuangan' && <LaporanKeuanganTab />}
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Tab 1: Chart of Accounts
// ---------------------------------------------------------------------------

const EMPTY_ACCOUNT_FORM = { kode: '', nama: '', tipe: 'beban', saldo_normal: 'debit', is_postable: true, aktif: true };

function ChartOfAccountsTab({ canManage }: { canManage: boolean }) {
    const { data, isLoading } = useAccounts();
    const createMutation = useCreateAccount();
    const updateMutation = useUpdateAccount();
    const deleteMutation = useDeleteAccount();
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Account | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
    const [form, setForm] = useState(EMPTY_ACCOUNT_FORM);

    const accounts = data?.data ?? [];
    const isEditing = editTarget !== null;

    const openCreateForm = () => {
        setEditTarget(null);
        setForm(EMPTY_ACCOUNT_FORM);
        setShowForm((s) => !s);
    };

    const openEditForm = (account: Account) => {
        setEditTarget(account);
        setForm({
            kode: account.kode,
            nama: account.nama,
            tipe: account.tipe,
            saldo_normal: account.saldo_normal,
            is_postable: account.is_postable,
            aktif: account.aktif,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditTarget(null);
        setForm(EMPTY_ACCOUNT_FORM);
    };

    const handleSave = () => {
        if (!form.kode || !form.nama) {
            toast.error('Kode dan nama akun wajib diisi');
            return;
        }

        if (isEditing && editTarget) {
            updateMutation.mutate(
                { id: editTarget.id, dto: form },
                {
                    onSuccess: () => {
                        toast.success('Akun berhasil diperbarui');
                        closeForm();
                    },
                    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui akun'),
                },
            );
            return;
        }

        createMutation.mutate(form, {
            onSuccess: () => {
                toast.success('Akun berhasil dibuat');
                closeForm();
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
                              <div className="flex items-center gap-1">
                                  <button
                                      onClick={() => openEditForm(row.original)}
                                      className="rounded p-1.5 text-blue-500 hover:bg-blue-50"
                                      title="Edit akun"
                                  >
                                      <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                      onClick={() => setDeleteTarget(row.original)}
                                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                      title="Hapus akun"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </button>
                              </div>
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
                        onClick={openCreateForm}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" /> Tambah Akun
                    </button>
                </div>
            )}

            {showForm && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">
                            {isEditing ? `Edit Akun — ${editTarget?.kode}` : 'Tambah Akun'}
                        </h4>
                        <button onClick={closeForm} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
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
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.is_postable}
                                onChange={(e) => setForm((f) => ({ ...f, is_postable: e.target.checked }))}
                            />
                            Postable (bisa dipakai transaksi)
                        </label>
                        {isEditing && (
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.aktif}
                                    onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))}
                                />
                                Aktif
                            </label>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending}
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
    const [showManualForm, setShowManualForm] = useState(false);
    const reverseMutation = useReverseJournalEntry();
    const cancelReversalMutation = useCancelReversal();

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

    const handleCancelReversal = (entry: JournalEntry) => {
        cancelReversalMutation.mutate(entry.id, {
            onSuccess: () => toast.success('Pembalikan jurnal berhasil dibatalkan, status kembali Terposting'),
            onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membatalkan pembalikan jurnal'),
        });
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
                          cell: ({ row }: { row: { original: JournalEntry } }) => (
                              <div className="flex items-center gap-1">
                                  {row.original.status === 'posted' && (
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
                                  )}
                                  {row.original.status === 'reversed' && (
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleCancelReversal(row.original);
                                          }}
                                          className="flex items-center gap-1 rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                                          title="Batalkan pembalikan (kembali ke Terposting)"
                                      >
                                          <Redo2 className="h-4 w-4" />
                                      </button>
                                  )}
                              </div>
                          ),
                      } as ColumnDef<JournalEntry>,
                  ]
                : []),
        ],
        [canManage],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
                        <option value="draft">Draft</option>
                        <option value="posted">Terposting</option>
                        <option value="reversed">Dibalik</option>
                    </select>
                </div>

                {canManage && (
                    <button
                        onClick={() => setShowManualForm((s) => !s)}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" /> Jurnal Manual
                    </button>
                )}
            </div>

            {showManualForm && <ManualEntryForm onClose={() => setShowManualForm(false)} />}

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
// Manual journal entry form (jurnal penyesuaian)
// ---------------------------------------------------------------------------

interface ManualEntryLine {
    account_id: number | undefined;
    debit: string;
    kredit: string;
    keterangan: string;
}

function ManualEntryForm({ onClose }: { onClose: () => void }) {
    const { data: unitsList } = useUnitsList();
    const { data: accountsData } = useAccounts();
    const createMutation = useCreateManualEntry();

    const postableAccounts = (accountsData?.data ?? []).filter((a) => a.is_postable);

    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [unitId, setUnitId] = useState<number | undefined>();
    const [keterangan, setKeterangan] = useState('');
    const [lines, setLines] = useState<ManualEntryLine[]>([
        { account_id: undefined, debit: '', kredit: '', keterangan: '' },
        { account_id: undefined, debit: '', kredit: '', keterangan: '' },
    ]);

    const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalKredit = lines.reduce((sum, l) => sum + (parseFloat(l.kredit) || 0), 0);
    const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalKredit) < 0.01;

    const updateLine = (index: number, field: keyof ManualEntryLine, value: string) => {
        setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    };

    const addLine = () => setLines((prev) => [...prev, { account_id: undefined, debit: '', kredit: '', keterangan: '' }]);
    const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!unitId) {
            toast.error('Unit wajib dipilih');
            return;
        }
        if (!isBalanced) {
            toast.error('Total debit dan kredit harus sama (balance)');
            return;
        }
        if (lines.some((l) => !l.account_id)) {
            toast.error('Setiap baris wajib memilih akun');
            return;
        }

        createMutation.mutate(
            {
                tanggal,
                unit_id: unitId,
                keterangan: keterangan || undefined,
                items: lines.map((l) => ({
                    account_id: l.account_id!,
                    unit_id: unitId,
                    debit: parseFloat(l.debit) || 0,
                    kredit: parseFloat(l.kredit) || 0,
                    keterangan: l.keterangan || undefined,
                })),
            },
            {
                onSuccess: () => {
                    toast.success('Jurnal manual berhasil dibuat');
                    onClose();
                },
                onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membuat jurnal manual'),
            },
        );
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Jurnal Manual (Penyesuaian)</h4>
                <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                    value={unitId ?? ''}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                >
                    <option value="">Pilih Unit...</option>
                    {unitsList?.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                            {unit.nama}
                        </option>
                    ))}
                </select>
                <input
                    placeholder="Keterangan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            <div className="mt-4 space-y-2">
                {lines.map((line, i) => (
                    <div key={i} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_2fr_auto]">
                        <select
                            value={line.account_id ?? ''}
                            onChange={(e) => updateLine(i, 'account_id', e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Pilih Akun...</option>
                            {postableAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.kode} — {acc.nama}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Debit"
                            value={line.debit}
                            onChange={(e) => updateLine(i, 'debit', e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Kredit"
                            value={line.kredit}
                            onChange={(e) => updateLine(i, 'kredit', e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                            placeholder="Keterangan baris"
                            value={line.keterangan}
                            onChange={(e) => updateLine(i, 'keterangan', e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => removeLine(i)}
                            disabled={lines.length <= 2}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={addLine} className="mt-2 text-xs font-medium text-blue-600 hover:underline">
                + Tambah baris
            </button>

            <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                <div className="flex gap-6 text-sm">
                    <span>
                        Total Debit: <strong>{formatRupiah(totalDebit)}</strong>
                    </span>
                    <span>
                        Total Kredit: <strong>{formatRupiah(totalKredit)}</strong>
                    </span>
                </div>
                <span className={cn('text-xs font-medium', isBalanced ? 'text-green-600' : 'text-red-500')}>
                    {isBalanced ? 'Balance' : 'Belum balance'}
                </span>
            </div>

            <div className="mt-3 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !isBalanced}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    Posting Jurnal
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tab 3: Buku Besar report
// ---------------------------------------------------------------------------

function BukuBesarReportTab() {
    const { data: accountsData } = useAccounts();
    const { data: unitsList } = useUnitsList();
    const currentYear = useAuthStore((s) => s.fiscalYear);
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

// ---------------------------------------------------------------------------
// Tab 4: Rekening Unit
// ---------------------------------------------------------------------------

function RekeningUnitTab() {
    const { data: unitsList } = useUnitsList();
    const currentYear = useAuthStore((s) => s.fiscalYear);
    const [unitId, setUnitId] = useState<number | undefined>();
    const [tahun, setTahun] = useState(currentYear);

    const params = unitId ? { unit_id: unitId, tahun } : null;
    const { data: report, isLoading } = useUnitLedger(params);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={unitId ?? ''}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}
                    className={selectClass}
                >
                    <option value="">Pilih Unit...</option>
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

            {!unitId && (
                <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Pilih unit untuk menampilkan saldo & mutasi dana unit tersebut.
                </p>
            )}

            {unitId && isLoading && (
                <p className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">Memuat...</p>
            )}

            {report && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-800">
                            {report.account.nama} — {report.unit.nama}
                        </p>
                        <p className="text-xs text-blue-600">Tahun Anggaran {report.tahun}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs text-slate-500">Saldo Awal (Total APBS)</p>
                            <p className="text-lg font-bold text-slate-800">{formatRupiah(report.saldo_awal)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs text-slate-500">Jumlah Mutasi</p>
                            <p className="text-lg font-bold text-slate-800">{report.mutasi.length} transaksi</p>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs text-blue-600">Saldo Akhir (Sisa Dana)</p>
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
                                    <th className="px-4 py-2 text-right">Debit (Masuk)</th>
                                    <th className="px-4 py-2 text-right">Kredit (Keluar)</th>
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
                                        <td className="px-4 py-2 text-right text-emerald-600">{m.debit > 0 ? formatRupiah(m.debit) : '—'}</td>
                                        <td className="px-4 py-2 text-right text-red-600">{m.kredit > 0 ? formatRupiah(m.kredit) : '—'}</td>
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

// ---------------------------------------------------------------------------
// Tab 5: Neraca Saldo (Trial Balance)
// ---------------------------------------------------------------------------

function NeracaSaldoTab() {
    const { data: unitsList } = useUnitsList();
    const currentYear = useAuthStore((s) => s.fiscalYear);
    const [unitId, setUnitId] = useState<number | undefined>();
    const [tahun, setTahun] = useState(currentYear);

    const { data: report, isLoading } = useTrialBalance({ unit_id: unitId, tahun });

    const totalDebit = report?.rows.reduce((s, r) => s + r.total_debit, 0) ?? 0;
    const totalKredit = report?.rows.reduce((s, r) => s + r.total_kredit, 0) ?? 0;

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
                <input
                    type="text"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    placeholder="Tahun"
                    className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {isLoading && (
                <p className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">Memuat...</p>
            )}

            {report && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr className="text-left text-xs text-slate-500">
                                <th className="px-4 py-2">Kode</th>
                                <th className="px-4 py-2">Nama Akun</th>
                                <th className="px-4 py-2 text-right">Saldo Awal</th>
                                <th className="px-4 py-2 text-right">Total Debit</th>
                                <th className="px-4 py-2 text-right">Total Kredit</th>
                                <th className="px-4 py-2 text-right">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.rows.map((row) => (
                                <tr key={row.account.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{row.account.kode}</td>
                                    <td className="px-4 py-2">{row.account.nama}</td>
                                    <td className="px-4 py-2 text-right">{formatRupiah(row.saldo_awal)}</td>
                                    <td className="px-4 py-2 text-right">{formatRupiah(row.total_debit)}</td>
                                    <td className="px-4 py-2 text-right">{formatRupiah(row.total_kredit)}</td>
                                    <td className="px-4 py-2 text-right font-medium">{formatRupiah(row.saldo_akhir)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                                <td colSpan={3} className="px-4 py-3">Total</td>
                                <td className="px-4 py-3 text-right">{formatRupiah(totalDebit)}</td>
                                <td className="px-4 py-3 text-right">{formatRupiah(totalKredit)}</td>
                                <td className="px-4 py-3 text-right">
                                    {Math.abs(totalDebit - totalKredit) < 0.01 ? (
                                        <span className="text-green-600">Balance</span>
                                    ) : (
                                        <span className="text-red-600">Tidak balance</span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tab 6: Neraca (Balance Sheet) & Laba Rugi (Income Statement)
// ---------------------------------------------------------------------------

function LaporanKeuanganTab() {
    const { data: unitsList } = useUnitsList();
    const currentYear = useAuthStore((s) => s.fiscalYear);
    const [unitId, setUnitId] = useState<number | undefined>();
    const [tahun, setTahun] = useState(currentYear);

    const params = { unit_id: unitId, tahun };
    const { data: income, isLoading: loadingIncome } = useIncomeStatement(params);
    const { data: balance, isLoading: loadingBalance } = useBalanceSheet(params);

    return (
        <div className="space-y-6">
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
                <input
                    type="text"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    placeholder="Tahun"
                    className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Laba Rugi */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700">Laporan Laba Rugi</h3>
                    {loadingIncome && <p className="text-sm text-slate-500">Memuat...</p>}
                    {income && (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase text-emerald-700">
                                Pendapatan
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {income.pendapatan.length === 0 && (
                                        <tr><td className="px-4 py-3 text-center text-slate-400">Tidak ada data.</td></tr>
                                    )}
                                    {income.pendapatan.map((row) => (
                                        <tr key={row.account.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2">{row.account.nama}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.jumlah)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-200 font-semibold">
                                        <td className="px-4 py-2">Total Pendapatan</td>
                                        <td className="px-4 py-2 text-right text-emerald-600">{formatRupiah(income.total_pendapatan)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-b border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase text-red-700">
                                Beban
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {income.beban.length === 0 && (
                                        <tr><td className="px-4 py-3 text-center text-slate-400">Tidak ada data.</td></tr>
                                    )}
                                    {income.beban.map((row) => (
                                        <tr key={row.account.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2">{row.account.nama}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.jumlah)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-200 font-semibold">
                                        <td className="px-4 py-2">Total Beban</td>
                                        <td className="px-4 py-2 text-right text-red-600">{formatRupiah(income.total_beban)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className={cn(
                                'flex items-center justify-between px-4 py-3 font-semibold',
                                income.laba_rugi >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700',
                            )}>
                                <span>{income.laba_rugi >= 0 ? 'Laba' : 'Rugi'} Tahun Berjalan</span>
                                <span>{formatRupiah(Math.abs(income.laba_rugi))}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Neraca */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700">Neraca</h3>
                    {loadingBalance && <p className="text-sm text-slate-500">Memuat...</p>}
                    {balance && (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-600">
                                Aset
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {balance.aset.map((row) => (
                                        <tr key={row.account.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2">{row.account.nama}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.saldo)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-200 font-semibold">
                                        <td className="px-4 py-2">Total Aset</td>
                                        <td className="px-4 py-2 text-right">{formatRupiah(balance.total_aset)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-b border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-600">
                                Kewajiban
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {balance.kewajiban.length === 0 && (
                                        <tr><td colSpan={2} className="px-4 py-3 text-center text-slate-400">Tidak ada data.</td></tr>
                                    )}
                                    {balance.kewajiban.map((row) => (
                                        <tr key={row.account.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2">{row.account.nama}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.saldo)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-200 font-semibold">
                                        <td className="px-4 py-2">Total Kewajiban</td>
                                        <td className="px-4 py-2 text-right">{formatRupiah(balance.total_kewajiban)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-b border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-600">
                                Ekuitas
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {balance.ekuitas.length === 0 && (
                                        <tr><td colSpan={2} className="px-4 py-3 text-center text-slate-400">Tidak ada data.</td></tr>
                                    )}
                                    {balance.ekuitas.map((row) => (
                                        <tr key={row.account.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2">{row.account.nama}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.saldo)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-100">
                                        <td className="px-4 py-2">Laba (Rugi) Tahun Berjalan</td>
                                        <td className="px-4 py-2 text-right">{formatRupiah(balance.laba_rugi_tahun_berjalan)}</td>
                                    </tr>
                                    <tr className="border-t border-slate-200 font-semibold">
                                        <td className="px-4 py-2">Total Ekuitas</td>
                                        <td className="px-4 py-2 text-right">{formatRupiah(balance.total_ekuitas)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className={cn(
                                'flex items-center justify-between px-4 py-3 font-semibold',
                                Math.abs(balance.total_aset - balance.total_kewajiban_dan_ekuitas) < 0.01
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-amber-50 text-amber-700',
                            )}>
                                <span>Total Kewajiban + Ekuitas</span>
                                <span>{formatRupiah(balance.total_kewajiban_dan_ekuitas)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
