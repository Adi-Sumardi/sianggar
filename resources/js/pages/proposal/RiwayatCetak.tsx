import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Printer, Eye, Search, Loader2 } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { VoucherModal } from '@/components/common/VoucherModal';
import { LpjVoucherModal } from '@/components/common/LpjVoucherModal';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useVoucherHistory, useLpjPrintHistory } from '@/hooks/useApprovals';
import type { PengajuanAnggaran, Lpj } from '@/types/models';

// ---------------------------------------------------------------------------
// Tab: Cetak Pengajuan (reuses the logic previously in VoucherHistory.tsx)
// ---------------------------------------------------------------------------

function CetakPengajuanTab() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [reprintTarget, setReprintTarget] = useState<PengajuanAnggaran | null>(null);

    const { data: vouchers = [], isLoading, isError, error } = useVoucherHistory();

    const filteredVouchers = vouchers.filter((item: PengajuanAnggaran) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        return (
            item.perihal?.toLowerCase().includes(searchLower) ||
            item.nomor_pengajuan?.toLowerCase().includes(searchLower) ||
            item.no_voucher?.toLowerCase().includes(searchLower) ||
            item.user?.name?.toLowerCase().includes(searchLower)
        );
    });

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
                    {error instanceof Error ? error.message : 'Gagal memuat data riwayat cetak'}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari berdasarkan nama, nomor, atau voucher..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {filteredVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                    <FileText className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                        {search.trim() ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat cetak voucher'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {search.trim() ? 'Coba kata kunci lain' : 'Voucher yang sudah dicetak akan muncul di sini'}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">No. Voucher</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pengajuan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pengaju</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Nominal</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVouchers.map((item: PengajuanAnggaran) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs font-medium text-blue-600">
                                            {item.no_voucher || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.perihal || item.nama_pengajuan}</p>
                                            <p className="text-xs text-slate-500">{item.nomor_pengajuan}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-slate-700">{item.user?.name || '-'}</p>
                                            <p className="text-xs text-slate-400">{item.unit?.nama || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-medium text-slate-900">
                                            {formatRupiah(item.approved_amount || item.jumlah_pengajuan_total)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={item.status_proses} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/approvals/${item.ulid ?? item.id}`)}
                                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReprintTarget(item)}
                                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                                                title="Cetak Ulang"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {reprintTarget && (
                <VoucherModal
                    pengajuan={reprintTarget}
                    open={!!reprintTarget}
                    onClose={() => setReprintTarget(null)}
                    onPrint={() => setReprintTarget(null)}
                />
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Tab: Cetak LPJ
// ---------------------------------------------------------------------------

function CetakLpjTab() {
    const [search, setSearch] = useState('');
    const [reprintTarget, setReprintTarget] = useState<Lpj | null>(null);

    const { data: historyResponse, isLoading, isError } = useLpjPrintHistory({ page: 1, per_page: 100 });
    const lpjs = historyResponse?.data ?? [];

    const filteredLpjs = lpjs.filter((item: Lpj) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        return (
            item.perihal?.toLowerCase().includes(searchLower) ||
            item.no_surat?.toLowerCase().includes(searchLower) ||
            item.pengajuan_anggaran?.user?.name?.toLowerCase().includes(searchLower)
        );
    });

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
                <p className="text-sm text-red-600">Gagal memuat data riwayat cetak LPJ</p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari berdasarkan perihal, nomor, atau pengaju..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {filteredLpjs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                    <FileText className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                        {search.trim() ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat cetak LPJ'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {search.trim() ? 'Coba kata kunci lain' : 'LPJ yang sudah dicetak akan muncul di sini'}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">No. LPJ</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Perihal</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pengaju</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Realisasi</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLpjs.map((item: Lpj) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs font-medium text-purple-600">
                                            {item.no_surat || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.perihal}</p>
                                            <p className="text-xs text-slate-500">{item.pengajuan_anggaran?.unit?.nama || item.unit || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-700">{item.pengajuan_anggaran?.user?.name || '-'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-medium text-slate-900">
                                            {formatRupiah(item.input_realisasi || 0)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={item.proses} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setReprintTarget(item)}
                                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-purple-600"
                                                title="Cetak Ulang"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {reprintTarget && (
                <LpjVoucherModal
                    lpj={reprintTarget}
                    open={!!reprintTarget}
                    onClose={() => setReprintTarget(null)}
                    onPrint={() => setReprintTarget(null)}
                />
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RiwayatCetak() {
    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Riwayat Cetak"
                        description="Daftar voucher pengajuan dan bukti LPJ yang sudah dicetak"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <Tabs defaultValue="pengajuan" className="w-full">
                        <TabsList>
                            <TabsTrigger value="pengajuan">Cetak Pengajuan</TabsTrigger>
                            <TabsTrigger value="lpj">Cetak LPJ</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pengajuan" className="mt-6">
                            <CetakPengajuanTab />
                        </TabsContent>

                        <TabsContent value="lpj" className="mt-6">
                            <CetakLpjTab />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
