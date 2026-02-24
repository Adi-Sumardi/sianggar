import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Wallet, TrendingDown, PiggyBank, Pencil, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { StatCard } from '@/components/common/StatCard';
import { useMataAnggaran, useSubMataAnggarans, useDetailMataAnggarans } from '@/hooks/useBudget';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MataAnggaranDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const mataAnggaranId = id ? parseInt(id, 10) : null;

    // Fetch mata anggaran data
    const { data: mataAnggaran, isLoading, isError, error } = useMataAnggaran(mataAnggaranId);

    // Fetch sub mata anggarans
    const { data: subMataAnggaransData } = useSubMataAnggarans(mataAnggaranId, { per_page: 100 });
    const subMataAnggarans = subMataAnggaransData?.data || [];

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
    if (isError || !mataAnggaran) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data mata anggaran'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/budget/mata-anggaran')}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </button>
                </div>
            </PageTransition>
        );
    }

    // Calculate totals from sub mata anggarans
    const totalAnggaran = mataAnggaran.jumlah ?? 0;
    const totalTerpakai = mataAnggaran.realisasi ?? 0;
    const totalSisa = mataAnggaran.sisa ?? (totalAnggaran - totalTerpakai);
    const percentUsed = totalAnggaran > 0 ? Math.round((totalTerpakai / totalAnggaran) * 100) : 0;

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
                        title="Detail Mata Anggaran"
                        description={`${mataAnggaran.kode} - ${mataAnggaran.nama}`}
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/budget/mata-anggaran')}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/budget/mata-anggaran/${id}/edit`)}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                {/* Info Card */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">Kode</p>
                                <p className="mt-0.5 font-mono text-sm font-semibold text-blue-700">{mataAnggaran.kode}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">Nama</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-900">{mataAnggaran.nama}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">Unit</p>
                                <p className="mt-0.5 text-sm text-slate-700">{mataAnggaran.unit?.nama ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">Tahun</p>
                                <p className="mt-0.5 text-sm text-slate-700">{mataAnggaran.tahun}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        title="Total Anggaran"
                        value={formatRupiah(totalAnggaran)}
                        icon={<Wallet className="h-5 w-5" />}
                        description="Anggaran awal keseluruhan"
                    />
                    <StatCard
                        title="Total Terpakai"
                        value={formatRupiah(totalTerpakai)}
                        icon={<TrendingDown className="h-5 w-5" />}
                        trend={{ value: percentUsed, isUp: false }}
                        description="dari total anggaran"
                    />
                    <StatCard
                        title="Sisa Saldo"
                        value={formatRupiah(totalSisa)}
                        icon={<PiggyBank className="h-5 w-5" />}
                        description="Saldo tersedia"
                    />
                </motion.div>

                {/* Progress Bar */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Penggunaan Anggaran</p>
                            <p className="text-sm font-semibold text-slate-900">{percentUsed}%</p>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentUsed}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={cn(
                                    'h-full rounded-full',
                                    percentUsed > 80 ? 'bg-red-500' : percentUsed > 60 ? 'bg-amber-500' : 'bg-blue-600',
                                )}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Tree View */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Struktur Anggaran
                            </h2>
                            <p className="text-sm text-slate-500">
                                Mata Anggaran &gt; Sub Mata Anggaran &gt; Detail Mata Anggaran
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {subMataAnggarans.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm text-slate-500">
                                    Tidak ada sub mata anggaran.
                                </div>
                            ) : (
                                subMataAnggarans.map((sub) => (
                                    <SubMataAnggaranSection key={sub.id} sub={sub} mataAnggaranId={mataAnggaranId!} />
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Sub section component
// ---------------------------------------------------------------------------

interface SubMataAnggaranSectionProps {
    sub: {
        id: number;
        kode: string;
        nama: string;
        jumlah?: number | null;
    };
    mataAnggaranId: number;
}

function SubMataAnggaranSection({ sub, mataAnggaranId }: SubMataAnggaranSectionProps) {
    // Fetch detail mata anggarans for this sub
    const { data: detailsData, isLoading } = useDetailMataAnggarans({
        mata_anggaran_id: mataAnggaranId,
        sub_mata_anggaran_id: sub.id,
        per_page: 100,
    });
    const details = detailsData?.data || [];

    const subTotal = sub.jumlah ?? details.reduce((s, d) => s + (d.jumlah ?? 0), 0);

    return (
        <div className="px-5 py-4">
            {/* Sub header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                        <ChevronRight className="h-4 w-4" />
                    </div>
                    <div>
                        <span className="font-mono text-xs font-medium text-blue-600">{sub.kode}</span>
                        <p className="text-sm font-semibold text-slate-900">{sub.nama}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Subtotal</p>
                    <p className="text-sm font-semibold text-slate-900">{formatRupiah(subTotal)}</p>
                </div>
            </div>

            {/* Detail items */}
            <div className="ml-11 space-y-2">
                {isLoading ? (
                    <div className="flex items-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-slate-500">Memuat detail...</span>
                    </div>
                ) : details.length === 0 ? (
                    <div className="py-4 text-sm text-slate-500">
                        Tidak ada detail mata anggaran.
                    </div>
                ) : (
                    details.map((detail) => {
                        const anggaran = detail.jumlah ?? 0;
                        const terpakai = detail.realisasi ?? 0;
                        const sisa = detail.sisa ?? (anggaran - terpakai);
                        const usagePercent = anggaran > 0 ? Math.round((terpakai / anggaran) * 100) : 0;

                        return (
                            <motion.div
                                key={detail.id}
                                {...cardHover}
                                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div>
                                        <span className="font-mono text-xs text-slate-500">{detail.kode ?? '-'}</span>
                                        <p className="text-sm font-medium text-slate-800">{detail.nama}</p>
                                    </div>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                                            usagePercent > 80
                                                ? 'bg-red-100 text-red-700'
                                                : usagePercent > 60
                                                  ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-emerald-100 text-emerald-700',
                                        )}
                                    >
                                        {usagePercent}% terpakai
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400">Anggaran</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {formatRupiah(anggaran)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Terpakai</p>
                                        <p className="text-sm font-semibold text-red-600">
                                            {formatRupiah(terpakai)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Sisa</p>
                                        <p className="text-sm font-semibold text-emerald-600">
                                            {formatRupiah(sisa)}
                                        </p>
                                    </div>
                                </div>

                                {/* Mini progress bar */}
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            usagePercent > 80
                                                ? 'bg-red-500'
                                                : usagePercent > 60
                                                  ? 'bg-amber-500'
                                                  : 'bg-blue-500',
                                        )}
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
