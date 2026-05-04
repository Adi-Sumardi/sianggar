import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BarChart3, Loader2, TrendingDown, TrendingUp, Eye, Wallet, Activity } from 'lucide-react';
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

export default function RapbsAnalisis() {
    const navigate = useNavigate();
    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

    const params = useMemo(() => ({ tahun: TAHUN_BARU }), []);
    const { data, isLoading, isError, error } = useRapbsAggregated(params);

    const units = data || [];

    const unitRows = units.map((unit) => {
        const apbsLama = unit.mata_anggarans.reduce((s, ma) => s + (ma.apbs_tahun_lalu ?? 0), 0);
        const realisasiJuni = unit.mata_anggarans.reduce((s, ma) => s + (ma.asumsi_realisasi ?? 0), 0);
        const plafonBaru = unit.mata_anggarans.reduce((s, ma) => s + (ma.plafon_apbs ?? 0), 0);
        const anggaranBaru = unit.mata_anggarans.reduce((s, ma) => s + (ma.total ?? 0), 0);
        const selisih = anggaranBaru - apbsLama;
        const persen = apbsLama > 0 ? (selisih / apbsLama) * 100 : 0;
        return {
            unitId: unit.unit_id,
            unitNama: unit.unit_nama,
            unitKode: unit.unit_kode,
            apbsLama,
            realisasiJuni,
            plafonBaru,
            anggaranBaru,
            selisih,
            persen,
        };
    });

    const totalApbsLama = unitRows.reduce((s, u) => s + u.apbsLama, 0);
    const totalRealisasiJuni = unitRows.reduce((s, u) => s + u.realisasiJuni, 0);
    const totalPlafonBaru = unitRows.reduce((s, u) => s + u.plafonBaru, 0);
    const totalAnggaranBaru = unitRows.reduce((s, u) => s + u.anggaranBaru, 0);
    const totalSelisih = totalAnggaranBaru - totalApbsLama;
    const totalPersen = totalApbsLama > 0 ? (totalSelisih / totalApbsLama) * 100 : 0;
    const isNaik = totalSelisih >= 0;

    const chartData = unitRows.map((u) => ({
        unit: u.unitNama,
        [`APBS ${TAHUN_LAMA}`]: u.apbsLama,
        [`Realisasi Juni ${TAHUN_LAMA}`]: u.realisasiJuni,
        [`Anggaran ${TAHUN_BARU}`]: u.anggaranBaru,
    }));

    const aggregateChart = [
        { label: `APBS ${TAHUN_LAMA}`, value: totalApbsLama, fill: '#94a3b8' },
        { label: `Realisasi Juni ${TAHUN_LAMA}`, value: totalRealisasiJuni, fill: '#f59e0b' },
        { label: `Anggaran ${TAHUN_BARU}`, value: totalAnggaranBaru, fill: isNaik ? '#0ea5e9' : '#10b981' },
    ];

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
                        title={`Analisis Perbandingan APBS ${TAHUN_LAMA} vs Anggaran ${TAHUN_BARU}`}
                        description="Perbandingan anggaran antar tahun ajaran per unit kerja, termasuk realisasi Juni tahun berjalan."
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/budget/rapbs')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke RAPBS
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
                            {error instanceof Error ? error.message : 'Gagal memuat data analisis'}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && (
                    <>
                        {/* Summary cards */}
                        <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title={`APBS ${TAHUN_LAMA}`}
                                value={formatRupiah(totalApbsLama)}
                                icon={<BarChart3 className="h-5 w-5" />}
                                description="Total tahun lalu"
                            />
                            <StatCard
                                title={`Realisasi Juni ${TAHUN_LAMA}`}
                                value={formatRupiah(totalRealisasiJuni)}
                                icon={<Activity className="h-5 w-5" />}
                                description={totalApbsLama > 0
                                    ? `${((totalRealisasiJuni / totalApbsLama) * 100).toFixed(1)}% dari APBS`
                                    : 'Realisasi tengah tahun'}
                            />
                            <StatCard
                                title={`Anggaran ${TAHUN_BARU}`}
                                value={formatRupiah(totalAnggaranBaru)}
                                icon={<Wallet className="h-5 w-5" />}
                                description="Total diajukan"
                            />
                            <StatCard
                                title={isNaik ? 'Kenaikan' : 'Penurunan'}
                                value={`${isNaik ? '+' : ''}${formatRupiah(totalSelisih)}`}
                                icon={isNaik ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                description={`${isNaik ? '▲' : '▼'} ${Math.abs(totalPersen).toFixed(2)}% vs APBS`}
                            />
                        </motion.div>

                        {/* Aggregate chart */}
                        <motion.div variants={staggerItem} {...cardHover}
                            className="rounded-lg border border-slate-200 bg-white p-5"
                        >
                            <h3 className="text-sm font-semibold text-slate-700">Grafik Agregat Keseluruhan</h3>
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

                        {/* Per-unit chart */}
                        {unitRows.length > 0 && (() => {
                            const filteredUnit = selectedUnitId !== 'all'
                                ? unitRows.find((u) => String(u.unitId) === selectedUnitId)
                                : null;

                            const singleUnitChart = filteredUnit
                                ? [
                                    { label: `APBS ${TAHUN_LAMA}`, value: filteredUnit.apbsLama, fill: '#94a3b8' },
                                    { label: `Realisasi Juni ${TAHUN_LAMA}`, value: filteredUnit.realisasiJuni, fill: '#f59e0b' },
                                    { label: `Anggaran ${TAHUN_BARU}`, value: filteredUnit.anggaranBaru, fill: '#0ea5e9' },
                                ]
                                : [];

                            return (
                                <motion.div variants={staggerItem} {...cardHover}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-700">Perbandingan per Unit</h3>
                                            {filteredUnit && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {filteredUnit.unitNama} ({filteredUnit.unitKode})
                                                </p>
                                            )}
                                        </div>
                                        <select
                                            value={selectedUnitId}
                                            onChange={(e) => setSelectedUnitId(e.target.value)}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="all">Semua Unit</option>
                                            {unitRows.map((u) => (
                                                <option key={u.unitId} value={String(u.unitId)}>
                                                    {u.unitNama}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-4 h-96 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {filteredUnit ? (
                                                <BarChart data={singleUnitChart} margin={{ top: 24, right: 20, left: 10, bottom: 5 }}>
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
                                                        {singleUnitChart.map((entry) => (
                                                            <Cell key={entry.label} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            ) : (
                                                <BarChart data={chartData} margin={{ top: 24, right: 20, left: 10, bottom: 60 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                    <XAxis
                                                        dataKey="unit"
                                                        tick={{ fontSize: 11, fill: '#334155' }}
                                                        angle={-25}
                                                        textAnchor="end"
                                                        height={70}
                                                    />
                                                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <RechartsTooltip
                                                        formatter={(value) => formatRupiah(Number(value))}
                                                        cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                                        contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar dataKey={`APBS ${TAHUN_LAMA}`} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey={`Realisasi Juni ${TAHUN_LAMA}`} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey={`Anggaran ${TAHUN_BARU}`} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>

                                    {filteredUnit && (
                                        <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-slate-500">Realisasi Juni vs APBS</p>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {filteredUnit.apbsLama > 0
                                                        ? `${((filteredUnit.realisasiJuni / filteredUnit.apbsLama) * 100).toFixed(2)}%`
                                                        : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Selisih</p>
                                                <p className={cn(
                                                    "text-sm font-semibold",
                                                    filteredUnit.selisih >= 0 ? "text-amber-700" : "text-emerald-700"
                                                )}>
                                                    {filteredUnit.selisih >= 0 ? '+' : ''}{formatRupiah(filteredUnit.selisih)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Perubahan</p>
                                                <p className={cn(
                                                    "text-sm font-semibold",
                                                    filteredUnit.selisih >= 0 ? "text-amber-700" : "text-emerald-700"
                                                )}>
                                                    {filteredUnit.apbsLama > 0
                                                        ? `${filteredUnit.selisih >= 0 ? '▲' : '▼'} ${Math.abs(filteredUnit.persen).toFixed(2)}%`
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })()}

                        {/* Detail table per unit */}
                        <motion.div variants={staggerItem}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-slate-700">Detail Perbandingan per Unit</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Unit</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">APBS {TAHUN_LAMA}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Realisasi Juni {TAHUN_LAMA}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Plafon {TAHUN_BARU}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Anggaran {TAHUN_BARU}</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Selisih</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Perubahan</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {unitRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Tidak ada data.
                                                </td>
                                            </tr>
                                        ) : (
                                            unitRows.map((u) => {
                                                const naik = u.selisih >= 0;
                                                return (
                                                    <tr key={u.unitId} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-medium text-slate-900">{u.unitNama}</p>
                                                            <p className="text-xs text-slate-500">{u.unitKode}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-slate-700">{formatRupiah(u.apbsLama)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-amber-700">{formatRupiah(u.realisasiJuni)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-sky-700">{formatRupiah(u.plafonBaru)}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{formatRupiah(u.anggaranBaru)}</td>
                                                        <td className={cn(
                                                            "px-4 py-3 text-right text-sm font-semibold",
                                                            naik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {naik ? '+' : ''}{formatRupiah(u.selisih)}
                                                        </td>
                                                        <td className={cn(
                                                            "px-4 py-3 text-right text-sm font-semibold",
                                                            naik ? "text-amber-700" : "text-emerald-700"
                                                        )}>
                                                            {u.apbsLama > 0 ? `${naik ? '▲' : '▼'} ${Math.abs(u.persen).toFixed(2)}%` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/budget/rapbs/analisis/${u.unitId}`)}
                                                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {unitRows.length > 0 && (
                                        <tfoot>
                                            <tr className="border-t border-slate-200 bg-slate-50/50">
                                                <td className="px-4 py-3 text-sm font-bold text-slate-900">Total Keseluruhan</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatRupiah(totalApbsLama)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-amber-700">{formatRupiah(totalRealisasiJuni)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-sky-700">{formatRupiah(totalPlafonBaru)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatRupiah(totalAnggaranBaru)}</td>
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
                                                <td />
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
