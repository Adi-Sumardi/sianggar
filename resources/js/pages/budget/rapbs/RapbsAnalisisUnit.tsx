import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BarChart3, Loader2, TrendingDown, TrendingUp, Wallet, Activity, Building2 } from 'lucide-react';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { StatCard } from '@/components/common/StatCard';
import { useRapbsList as useRapbsAggregated } from '@/hooks/useBudget';

const TAHUN_LAMA = '2025/2026';
const TAHUN_BARU = '2026/2027';

function formatCompact(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return value.toString();
}

export default function RapbsAnalisisUnit() {
    const navigate = useNavigate();
    const { unitId } = useParams<{ unitId: string }>();
    const [search, setSearch] = useState('');

    const params = useMemo(() => ({ tahun: TAHUN_BARU }), []);
    const { data, isLoading, isError, error } = useRapbsAggregated(params);

    const unit = useMemo(
        () => (data || []).find((u) => String(u.unit_id) === unitId),
        [data, unitId]
    );

    const filteredMa = useMemo(() => {
        if (!unit) return [];
        const q = search.trim().toLowerCase();
        if (!q) return unit.mata_anggarans;
        return unit.mata_anggarans.filter(
            (ma) => ma.nama.toLowerCase().includes(q) || ma.kode.toLowerCase().includes(q)
        );
    }, [unit, search]);

    const totalApbsLama = filteredMa.reduce((s, ma) => s + (ma.apbs_tahun_lalu ?? 0), 0);
    const totalRealisasi = filteredMa.reduce((s, ma) => s + (ma.asumsi_realisasi ?? 0), 0);
    const totalAnggaran = filteredMa.reduce((s, ma) => s + (ma.total ?? 0), 0);
    const totalSelisih = totalAnggaran - totalApbsLama;
    const totalPersen = totalApbsLama > 0 ? (totalSelisih / totalApbsLama) * 100 : 0;
    const isNaik = totalSelisih >= 0;

    const aggregateChart = [
        { label: `APBS ${TAHUN_LAMA}`, value: totalApbsLama, fill: '#94a3b8' },
        { label: `Realisasi Juni ${TAHUN_LAMA}`, value: totalRealisasi, fill: '#f59e0b' },
        { label: `Anggaran ${TAHUN_BARU}`, value: totalAnggaran, fill: isNaik ? '#0ea5e9' : '#10b981' },
    ];

    // Top 10 mata anggaran by anggaran baru for chart legibility
    const topMaChart = [...filteredMa]
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
        .slice(0, 10)
        .map((ma) => ({
            nama: ma.nama.length > 24 ? ma.nama.slice(0, 22) + '…' : ma.nama,
            [`APBS ${TAHUN_LAMA}`]: ma.apbs_tahun_lalu ?? 0,
            [`Realisasi Juni ${TAHUN_LAMA}`]: ma.asumsi_realisasi ?? 0,
            [`Anggaran ${TAHUN_BARU}`]: ma.total ?? 0,
        }));

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title={unit ? `Detail Analisis - ${unit.unit_nama}` : 'Detail Analisis Unit'}
                        description={unit
                            ? `Perbandingan APBS ${TAHUN_LAMA} vs Anggaran ${TAHUN_BARU} per mata anggaran (Kode: ${unit.unit_kode}).`
                            : 'Memuat data unit...'}
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/budget/rapbs/analisis')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Analisis
                            </button>
                        }
                    />
                </motion.div>

                {isLoading && (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50">
                        <p className="text-sm text-red-600">
                            {error instanceof Error ? error.message : 'Gagal memuat data analisis unit'}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && !unit && (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white">
                        <Building2 className="h-8 w-8 text-slate-300" />
                        <p className="text-sm text-slate-500">Unit tidak ditemukan.</p>
                    </div>
                )}

                {!isLoading && !isError && unit && (
                    <>
                        {/* Summary cards */}
                        <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title={`APBS ${TAHUN_LAMA}`}
                                value={formatRupiah(totalApbsLama)}
                                icon={<BarChart3 className="h-5 w-5" />}
                                description="Tahun lalu"
                            />
                            <StatCard
                                title={`Realisasi Juni ${TAHUN_LAMA}`}
                                value={formatRupiah(totalRealisasi)}
                                icon={<Activity className="h-5 w-5" />}
                                description={totalApbsLama > 0
                                    ? `${((totalRealisasi / totalApbsLama) * 100).toFixed(1)}% dari APBS`
                                    : 'Realisasi tengah tahun'}
                            />
                            <StatCard
                                title={`Anggaran ${TAHUN_BARU}`}
                                value={formatRupiah(totalAnggaran)}
                                icon={<Wallet className="h-5 w-5" />}
                                description="Diajukan"
                            />
                            <StatCard
                                title={isNaik ? 'Kenaikan' : 'Penurunan'}
                                value={`${isNaik ? '+' : ''}${formatRupiah(totalSelisih)}`}
                                icon={isNaik ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                description={`${isNaik ? '▲' : '▼'} ${Math.abs(totalPersen).toFixed(2)}% vs APBS`}
                            />
                        </motion.div>

                        {/* Aggregate chart untuk unit ini */}
                        <motion.div variants={staggerItem} {...cardHover}
                            className="rounded-lg border border-slate-200 bg-white p-5"
                        >
                            <h3 className="text-sm font-semibold text-slate-700">Grafik Agregat Unit</h3>
                            <div className="mt-4 h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aggregateChart} margin={{ top: 24, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#334155' }} />
                                        <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <RechartsTooltip
                                            formatter={(value) => [formatRupiah(Number(value)), 'Nilai']}
                                            cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            radius={[6, 6, 0, 0]}
                                            label={{
                                                position: 'top',
                                                formatter: (v) => formatCompact(Number(v)),
                                                fontSize: 11,
                                                fill: '#475569',
                                            }}
                                        >
                                            {aggregateChart.map((entry) => (
                                                <Cell key={entry.label} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Top mata anggaran chart */}
                        {topMaChart.length > 0 && (
                            <motion.div variants={staggerItem} {...cardHover}
                                className="rounded-lg border border-slate-200 bg-white p-5"
                            >
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Top {topMaChart.length} Mata Anggaran (berdasar Anggaran {TAHUN_BARU})
                                </h3>
                                <div className="mt-4 h-96 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topMaChart} margin={{ top: 24, right: 20, left: 10, bottom: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis
                                                dataKey="nama"
                                                tick={{ fontSize: 11, fill: '#334155' }}
                                                angle={-25}
                                                textAnchor="end"
                                                height={80}
                                                interval={0}
                                            />
                                            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <RechartsTooltip
                                                formatter={(value) => formatRupiah(Number(value))}
                                                cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey={`APBS ${TAHUN_LAMA}`} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey={`Realisasi Juni ${TAHUN_LAMA}`} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey={`Anggaran ${TAHUN_BARU}`} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}

                        {/* Detail table per mata anggaran */}
                        <motion.div variants={staggerItem}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-slate-700">Detail per Mata Anggaran</h3>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari mata anggaran..."
                                    className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Kode</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Mata Anggaran</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">APBS {TAHUN_LAMA}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Realisasi Juni {TAHUN_LAMA}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Anggaran {TAHUN_BARU}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Selisih</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Perubahan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredMa.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Tidak ada mata anggaran.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMa.map((ma) => {
                                                const apbs = ma.apbs_tahun_lalu ?? 0;
                                                const realisasi = ma.asumsi_realisasi ?? 0;
                                                const anggaran = ma.total ?? 0;
                                                const selisih = anggaran - apbs;
                                                const persen = apbs > 0 ? (selisih / apbs) * 100 : 0;
                                                const naik = selisih >= 0;
                                                return (
                                                    <tr key={ma.id} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-mono text-xs text-blue-600">{ma.kode}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">{ma.nama}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-slate-700">{formatRupiah(apbs)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-amber-700">{formatRupiah(realisasi)}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{formatRupiah(anggaran)}</td>
                                                        <td className={cn(
                                                            "px-4 py-3 text-right text-sm font-semibold",
                                                            naik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {naik ? '+' : ''}{formatRupiah(selisih)}
                                                        </td>
                                                        <td className={cn(
                                                            "px-4 py-3 text-right text-sm font-semibold",
                                                            naik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {apbs > 0 ? `${naik ? '▲' : '▼'} ${Math.abs(persen).toFixed(2)}%` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {filteredMa.length > 0 && (
                                        <tfoot>
                                            <tr className="border-t border-slate-200 bg-slate-50/50">
                                                <td className="px-4 py-3" />
                                                <td className="px-4 py-3 text-sm font-bold text-slate-900">Total</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatRupiah(totalApbsLama)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-amber-700">{formatRupiah(totalRealisasi)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatRupiah(totalAnggaran)}</td>
                                                <td className={cn(
                                                    "px-4 py-3 text-right text-sm font-bold",
                                                    isNaik ? "text-amber-700" : "text-emerald-700"
                                                )}>
                                                    {isNaik ? '+' : ''}{formatRupiah(totalSelisih)}
                                                </td>
                                                <td className={cn(
                                                    "px-4 py-3 text-right text-sm font-bold",
                                                    isNaik ? "text-amber-700" : "text-emerald-700"
                                                )}>
                                                    {totalApbsLama > 0 ? `${isNaik ? '▲' : '▼'} ${Math.abs(totalPersen).toFixed(2)}%` : '-'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>
        </PageTransition>
    );
}
