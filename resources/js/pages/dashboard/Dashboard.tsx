import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useEmailReminderStats } from '@/hooks/useEmails';
import { useDashboardStats, useDashboardCharts, useMonthlyCharts, useRecentPengajuan, useStatusDistribution, useUnitsList, useReminderStats } from '@/hooks/useDashboard';
import { RevisionReminderModal } from '@/components/common/RevisionReminderModal';
import { EmailReminderModal } from '@/components/common/EmailReminderModal';
import { ApprovalReminderModal } from '@/components/common/ApprovalReminderModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
    Users,
    FileText,
    ClipboardList,
    Wallet,
    Clock,
    FileCheck,
    CheckCircle,
    ArrowUpRight,
    TrendingUp,
    Plus,
    DollarSign,
    ArrowUpRight as ArrowUpRightIcon,
    ShieldCheck,
    Building2,
    Loader2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRupiah } from '@/lib/currency';
import { staggerItem, slideFromLeft, slideFromRight, float, staggerContainerSlow } from '@/lib/animations';
import { getDashboardType } from '@/types/enums';
import type { UserRole } from '@/types/enums';

// =============================================================================
// Default status colors for pie chart
// =============================================================================

const defaultStatusColors = [
    { name: 'Draft', value: 0, color: '#94a3b8' },
    { name: 'Diajukan', value: 0, color: '#3b82f6' },
    { name: 'Disetujui', value: 0, color: '#22c55e' },
    { name: 'Direvisi', value: 0, color: '#f97316' },
    { name: 'Ditolak', value: 0, color: '#ef4444' },
];

// =============================================================================
// Chart tooltip formatter
// =============================================================================

function rupiahFormatter(value: number) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}Rb`;
    return String(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <p key={idx} className="text-xs" style={{ color: entry.color }}>
                    {entry.name}: {formatRupiah(entry.value)}
                </p>
            ))}
        </div>
    );
}

// =============================================================================
// Skeleton loader
// =============================================================================

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
            <div className="mb-2 h-7 w-32 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
    );
}

function SkeletonChart() {
    return (
        <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 h-4 w-48 rounded bg-slate-200" />
            <div className="h-64 rounded bg-slate-100" />
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 h-4 w-40 rounded bg-slate-200" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3 flex gap-4">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-3 w-40 rounded bg-slate-200" />
                    <div className="h-3 w-16 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Section header component
// =============================================================================

function SectionHeader({
    title,
    action,
}: {
    title: string;
    action?: { label: string; href: string };
}) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {action && (
                <Link
                    to={action.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                    {action.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    );
}

// =============================================================================
// Dynamic greeting
// =============================================================================

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

// =============================================================================
// Dashboard Hero Header — gradient blue with decorative elements
// =============================================================================

interface DashboardHeroProps {
    title: string;
    userName: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
}

function DashboardHero({ title, userName, badge, actions }: DashboardHeroProps) {
    const greeting = getGreeting();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#063E66] to-[#1C61A2] px-6 py-6 text-white shadow-lg sm:px-8 sm:py-8"
        >
            {/* Decorative floating circles */}
            <motion.div
                {...float}
                className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5"
            />
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -bottom-4 right-20 h-20 w-20 rounded-full bg-white/5"
            />
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute left-1/3 top-2 h-12 w-12 rounded-full bg-white/[0.03]"
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                        {title}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
                        {greeting}, {userName}
                        {badge}
                    </p>
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </motion.div>
    );
}

// =============================================================================
// Admin Dashboard
// =============================================================================

function AdminDashboard({ userName }: { userName: string }) {
    const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(undefined);

    // Fetch units list for filter dropdown
    const { data: unitsList = [] } = useUnitsList();

    // Fetch dashboard data with unit filter
    const { data: statsData, isLoading: statsLoading } = useDashboardStats(
        selectedUnitId ? { unit_id: selectedUnitId } : undefined
    );
    const { data: chartsData = [], isLoading: chartsLoading } = useDashboardCharts(
        selectedUnitId ? { unit_id: selectedUnitId } : undefined
    );
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan(
        selectedUnitId ? { unit_id: selectedUnitId, limit: 10 } : { limit: 10 }
    );
    const { data: statusDistribution = [] } = useStatusDistribution(
        selectedUnitId ? { unit_id: selectedUnitId } : undefined
    );

    const stats = statsData?.stats ?? {};
    const selectedUnit = unitsList.find(u => u.id === selectedUnitId);

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Admin"
                userName={userName}
                badge={selectedUnit && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                        <Building2 className="h-3 w-3" />
                        {selectedUnit.nama}
                    </span>
                )}
                actions={
                    <div className="w-full sm:w-64">
                        <SearchableSelect
                            options={[
                                { value: '', label: 'Semua Unit' },
                                ...unitsList.map(u => ({ value: String(u.id), label: u.nama })),
                            ]}
                            value={selectedUnitId ? String(selectedUnitId) : ''}
                            onChange={(val) => setSelectedUnitId(val ? Number(val) : undefined)}
                            placeholder="Filter berdasarkan unit..."
                            searchPlaceholder="Cari unit..."
                        />
                    </div>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total User"
                            value={stats.total_users ?? 0}
                            icon={<Users className="h-5 w-5" />}
                            description={selectedUnit ? `di ${selectedUnit.nama}` : 'semua unit'}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Pengajuan"
                            value={stats.total_pengajuan ?? 0}
                            icon={<FileText className="h-5 w-5" />}
                            description={selectedUnit ? `di ${selectedUnit.nama}` : 'semua unit'}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total LPJ"
                            value={stats.total_lpj ?? 0}
                            icon={<ClipboardList className="h-5 w-5" />}
                            description={selectedUnit ? `di ${selectedUnit.nama}` : 'semua unit'}
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Anggaran"
                            value={formatRupiah(stats.total_anggaran ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            description="tahun berjalan"
                            className="[&>div:first-child]:bg-purple-50 [&>div:first-child]:text-purple-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Additional stats for filtered unit */}
            {selectedUnitId && !statsLoading && (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-3"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Saldo Anggaran"
                            value={formatRupiah(stats.saldo_anggaran ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            description="sisa anggaran"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Realisasi"
                            value={formatRupiah(stats.total_realisasi ?? 0)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            description="total penggunaan"
                            className="[&>div:first-child]:bg-blue-50 [&>div:first-child]:text-blue-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="% Realisasi"
                            value={`${stats.total_anggaran ? Math.round(((stats.total_realisasi ?? 0) / stats.total_anggaran) * 100) : 0}%`}
                            icon={<TrendingUp className="h-5 w-5" />}
                            description="dari anggaran"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Bar chart: Anggaran vs Realisasi */}
                <motion.div
                    {...slideFromLeft}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-lg border border-slate-200 bg-white p-5"
                >
                    <SectionHeader title={selectedUnit ? `Anggaran vs Realisasi - ${selectedUnit.nama}` : "Anggaran vs Realisasi per Unit"} />
                    {chartsLoading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartsData}
                                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="unit"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={rupiahFormatter}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="anggaran"
                                    name="Anggaran"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={16}
                                />
                                <Bar
                                    dataKey="realisasi"
                                    name="Realisasi"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    barSize={16}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                            Anggaran
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                            Realisasi
                        </span>
                    </div>
                </motion.div>

                {/* Pie chart: Status Pengajuan */}
                <motion.div
                    {...slideFromRight}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="rounded-lg border border-slate-200 bg-white p-5"
                >
                    <SectionHeader title="Status Pengajuan" />
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusDistribution.length > 0 ? statusDistribution : defaultStatusColors}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {(statusDistribution.length > 0 ? statusDistribution : defaultStatusColors).map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [
                                    `${value ?? 0} pengajuan`,
                                    String(name),
                                ]}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-xs text-slate-600">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Recent pengajuan table */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title={selectedUnit ? `Pengajuan Terbaru - ${selectedUnit.nama}` : "Pengajuan Terbaru"}
                        action={{ label: 'Lihat Semua', href: '/pengajuan' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Belum ada pengajuan
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Surat
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                                            {item.nomor}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <StatusBadge status={item.status} size="sm" />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Unit Dashboard
// =============================================================================

function UnitDashboard({ userName }: { userName: string }) {
    // Fetch dashboard data
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: monthlyData = [], isLoading: monthlyLoading } = useMonthlyCharts();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Unit"
                userName={userName}
                badge={stats.unit_nama && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                        <Building2 className="h-3 w-3" />
                        {stats.unit_nama}
                    </span>
                )}
                actions={
                    <>
                        <Link
                            to="/pengajuan/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
                        >
                            <Plus className="h-4 w-4" />
                            Buat Pengajuan
                        </Link>
                        <Link
                            to="/lpj/create"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                            <FileCheck className="h-4 w-4" />
                            Buat LPJ
                        </Link>
                    </>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Saldo Anggaran"
                            value={formatRupiah(stats.saldo_anggaran ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            description="sisa anggaran"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Pengajuan Pending"
                            value={stats.pending_pengajuan ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="menunggu proses"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Pengajuan"
                            value={stats.total_pengajuan ?? 0}
                            icon={<FileText className="h-5 w-5" />}
                            description="semua pengajuan"
                            className="[&>div:first-child]:bg-blue-50 [&>div:first-child]:text-blue-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Bar chart: Pengajuan vs Realisasi per Bulan */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white p-5"
            >
                <SectionHeader title="Pengajuan vs Realisasi per Bulan" />
                {monthlyLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : monthlyData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                        Belum ada data anggaran
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={monthlyData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="bulan"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={rupiahFormatter}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="pengajuan"
                                name="Pengajuan"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                            <Bar
                                dataKey="realisasi"
                                name="Realisasi"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                        Pengajuan
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                        Realisasi
                    </span>
                </div>
            </motion.div>

            {/* Recent pengajuan table */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Pengajuan Terbaru"
                        action={{ label: 'Lihat Semua', href: '/pengajuan' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Belum ada pengajuan
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Surat
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                                            {item.nomor}
                                        </td>
                                        <td className="max-w-[280px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <StatusBadge status={item.status} size="sm" />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Approver Dashboard
// =============================================================================

function ApproverDashboard({ userName }: { userName: string }) {
    // Fetch dashboard data
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: monthlyData = [], isLoading: monthlyLoading } = useMonthlyCharts();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Persetujuan"
                userName={userName}
                actions={
                    <Link
                        to="/approvals"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Lihat Semua Approval
                    </Link>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Menunggu Approval"
                            value={stats.pending_approval ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="perlu ditindaklanjuti"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Disetujui"
                            value={stats.total_approved ?? 0}
                            icon={<CheckCircle className="h-5 w-5" />}
                            description="pengajuan disetujui"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Pengajuan"
                            value={stats.total_pengajuan ?? 0}
                            icon={<FileText className="h-5 w-5" />}
                            description="semua pengajuan"
                            className="[&>div:first-child]:bg-blue-50 [&>div:first-child]:text-blue-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Bar chart: Pengajuan vs Realisasi per Bulan */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white p-5"
            >
                <SectionHeader title="Pengajuan vs Realisasi per Bulan" />
                {monthlyLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : monthlyData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                        Belum ada data anggaran
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={monthlyData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="bulan"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={rupiahFormatter}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="pengajuan"
                                name="Pengajuan"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                            <Bar
                                dataKey="realisasi"
                                name="Realisasi"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                        Pengajuan
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                        Realisasi
                    </span>
                </div>
            </motion.div>

            {/* Approval queue */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Antrian Persetujuan"
                        action={{ label: 'Lihat Semua', href: '/approvals' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Tidak ada pengajuan menunggu approval
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Surat
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                                            {item.nomor}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <StatusBadge status={item.status} size="sm" />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Finance Dashboard
// =============================================================================

function FinanceDashboard({ userName }: { userName: string }) {
    // Fetch dashboard data
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: chartsData = [], isLoading: chartsLoading } = useDashboardCharts();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero title="Dashboard Keuangan" userName={userName} />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Anggaran"
                            value={formatRupiah(stats.total_anggaran ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            description="tahun berjalan"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Pengeluaran"
                            value={formatRupiah(stats.total_pengeluaran ?? 0)}
                            icon={<ArrowUpRightIcon className="h-5 w-5" />}
                            description="realisasi"
                            className="[&>div:first-child]:bg-red-50 [&>div:first-child]:text-red-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Saldo Anggaran"
                            value={formatRupiah(stats.saldo_anggaran ?? 0)}
                            icon={<DollarSign className="h-5 w-5" />}
                            description="sisa anggaran"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Pending Payment"
                            value={stats.pending_payment ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="menunggu pembayaran"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Bar chart: Anggaran vs Realisasi */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white p-5"
            >
                <SectionHeader title="Anggaran vs Realisasi per Unit" />
                {chartsLoading ? (
                    <div className="flex h-[320px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : chartsData.length === 0 ? (
                    <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                        Belum ada data anggaran
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={chartsData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="unit"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={rupiahFormatter}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="anggaran"
                                name="Anggaran"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                            <Bar
                                dataKey="realisasi"
                                name="Realisasi"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                        Anggaran
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                        Realisasi
                    </span>
                </div>
            </motion.div>

            {/* Recent pengajuan / verification queue */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Pengajuan Terbaru"
                        action={{ label: 'Lihat Semua', href: '/pengajuan' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Belum ada pengajuan
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Surat
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                                            {item.nomor}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <StatusBadge status={item.status} size="sm" />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Kasir Dashboard
// =============================================================================

function KasirDashboard({ userName }: { userName: string }) {
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Kasir"
                userName={userName}
                actions={
                    <Link
                        to="/approvals"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        <FileText className="h-4 w-4" />
                        Lihat Antrian Cetak
                    </Link>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Menunggu Cetak"
                            value={stats.menunggu_cetak ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="perlu dicetak"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Dicetak Hari Ini"
                            value={stats.dicetak_hari_ini ?? 0}
                            icon={<CheckCircle className="h-5 w-5" />}
                            description="voucher dicetak"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Cetak Bulan Ini"
                            value={stats.total_cetak_bulan_ini ?? 0}
                            icon={<FileCheck className="h-5 w-5" />}
                            description="voucher dicetak"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Print queue */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Antrian Cetak"
                        action={{ label: 'Lihat Semua', href: '/approvals' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Tidak ada antrian cetak
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Voucher
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-blue-600">
                                            {item.no_voucher ?? '-'}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Payment Dashboard
// =============================================================================

function PaymentDashboard({ userName }: { userName: string }) {
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Payment"
                userName={userName}
                actions={
                    <Link
                        to="/approvals"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        <DollarSign className="h-4 w-4" />
                        Lihat Antrian Pembayaran
                    </Link>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Menunggu Proses"
                            value={stats.menunggu_proses ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="perlu diproses"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Diproses Hari Ini"
                            value={stats.diproses_hari_ini ?? 0}
                            icon={<CheckCircle className="h-5 w-5" />}
                            description="pembayaran selesai"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Proses Bulan Ini"
                            value={stats.total_proses_bulan_ini ?? 0}
                            icon={<DollarSign className="h-5 w-5" />}
                            description="pembayaran selesai"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Payment queue */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Antrian Pembayaran"
                        action={{ label: 'Lihat Semua', href: '/approvals' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Tidak ada antrian pembayaran
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Voucher
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-blue-600">
                                            {item.no_voucher ?? '-'}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Leadership Dashboard
// =============================================================================

function LeadershipDashboard({ userName }: { userName: string }) {
    // Fetch dashboard data
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: chartsData = [], isLoading: chartsLoading } = useDashboardCharts();
    const { data: recentPengajuan = [], isLoading: recentLoading } = useRecentPengajuan({ limit: 10 });
    const { data: statusDistribution = [] } = useStatusDistribution();

    const stats = statsData?.stats ?? {};

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <DashboardHero
                title="Dashboard Pimpinan"
                userName={userName}
                actions={
                    <Link
                        to="/approvals"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Approval Center
                    </Link>
                }
            />

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <motion.div
                    variants={staggerContainerSlow}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Menunggu Approval"
                            value={stats.pending_approval ?? 0}
                            icon={<Clock className="h-5 w-5" />}
                            description="perlu tindakan"
                            className="[&>div:first-child]:bg-amber-50 [&>div:first-child]:text-amber-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Anggaran"
                            value={formatRupiah(stats.total_anggaran ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            description="tahun berjalan"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Realisasi"
                            value={formatRupiah(stats.total_realisasi ?? stats.total_pengeluaran ?? 0)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            description="total pengeluaran"
                            className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600"
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard
                            title="Total Disetujui"
                            value={stats.total_approved ?? 0}
                            icon={<CheckCircle className="h-5 w-5" />}
                            description="pengajuan disetujui"
                            className="[&>div:first-child]:bg-blue-50 [&>div:first-child]:text-blue-600"
                        />
                    </motion.div>
                </motion.div>
            )}

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Bar chart: Anggaran vs Realisasi */}
                <motion.div
                    {...slideFromLeft}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-lg border border-slate-200 bg-white p-5"
                >
                    <SectionHeader title="Anggaran vs Realisasi per Unit" />
                    {chartsLoading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : chartsData.length === 0 ? (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                            Belum ada data anggaran
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartsData}
                                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="unit"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={rupiahFormatter}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="anggaran"
                                    name="Anggaran"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={16}
                                />
                                <Bar
                                    dataKey="realisasi"
                                    name="Realisasi"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    barSize={16}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                            Anggaran
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                            Realisasi
                        </span>
                    </div>
                </motion.div>

                {/* Pie chart: Status Pengajuan */}
                <motion.div
                    {...slideFromRight}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="rounded-lg border border-slate-200 bg-white p-5"
                >
                    <SectionHeader title="Status Pengajuan" />
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusDistribution.length > 0 ? statusDistribution : defaultStatusColors}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {(statusDistribution.length > 0 ? statusDistribution : defaultStatusColors).map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [
                                    `${value ?? 0} pengajuan`,
                                    String(name),
                                ]}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-xs text-slate-600">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Approval queue */}
            <motion.div
                {...slideFromLeft}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="rounded-lg border border-slate-200 bg-white"
            >
                <div className="p-5 pb-0">
                    <SectionHeader
                        title="Pengajuan Terbaru"
                        action={{ label: 'Lihat Semua', href: '/approvals' }}
                    />
                </div>
                <div className="overflow-x-auto">
                    {recentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : recentPengajuan.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Belum ada pengajuan
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        No Surat
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Perihal
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPengajuan.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                                            {item.nomor}
                                        </td>
                                        <td className="max-w-[240px] truncate px-5 py-3 text-slate-700">
                                            {item.perihal}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <StatusBadge status={item.status} size="sm" />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                                            {item.tanggal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// Main Dashboard (exported)
// =============================================================================

// Session storage keys for reminders
const APPROVAL_REMINDER_DISMISSED_KEY = 'sianggar_approval_reminder_dismissed';
const REVISION_REMINDER_DISMISSED_KEY = 'sianggar_revision_reminder_dismissed';
const EMAIL_REMINDER_DISMISSED_KEY = 'sianggar_email_reminder_dismissed';

export default function Dashboard() {
    const { user, isLoading } = useAuth();
    const { data: reminderStats } = useReminderStats();
    const { data: emailStats } = useEmailReminderStats();
    const [showApprovalReminder, setShowApprovalReminder] = useState(false);
    const [showRevisionReminder, setShowRevisionReminder] = useState(false);
    const [showEmailReminder, setShowEmailReminder] = useState(false);

    const dashboardType = useMemo(() => {
        if (!user?.role) return 'unit';
        return getDashboardType(user.role as UserRole);
    }, [user?.role]);

    const userName = user?.name ?? 'Pengguna';

    // Check if we should show approval reminder modal (for approver roles)
    useEffect(() => {
        if (!reminderStats) return;

        const hasPending =
            (reminderStats.pending_pengajuan_approval ?? 0) > 0 ||
            (reminderStats.pending_lpj_approval ?? 0) > 0 ||
            (reminderStats.pending_rapbs_approval ?? 0) > 0;
        const wasDismissed = sessionStorage.getItem(APPROVAL_REMINDER_DISMISSED_KEY) === 'true';

        if (hasPending && !wasDismissed) {
            const timer = setTimeout(() => {
                setShowApprovalReminder(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [reminderStats]);

    // Check if we should show revision reminder modal (for unit/substansi roles)
    useEffect(() => {
        if (!reminderStats) return;

        const hasRevisions =
            (reminderStats.revised_pengajuan_count ?? 0) > 0 ||
            (reminderStats.revised_lpj_count ?? 0) > 0 ||
            (reminderStats.revised_rapbs_count ?? 0) > 0 ||
            (reminderStats.rejected_pengajuan_count ?? 0) > 0 ||
            (reminderStats.rejected_lpj_count ?? 0) > 0 ||
            (reminderStats.rejected_rapbs_count ?? 0) > 0;
        const wasDismissed = sessionStorage.getItem(REVISION_REMINDER_DISMISSED_KEY) === 'true';

        if (hasRevisions && !wasDismissed) {
            // Show after approval reminder if any
            const timer = setTimeout(() => {
                setShowRevisionReminder(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [reminderStats]);

    // Check if we should show email reminder modal
    useEffect(() => {
        if (!emailStats) return;

        const hasEmails = (emailStats.unread_email_count ?? 0) > 0 || (emailStats.unread_reply_count ?? 0) > 0;
        const wasDismissed = sessionStorage.getItem(EMAIL_REMINDER_DISMISSED_KEY) === 'true';

        if (hasEmails && !wasDismissed) {
            const timer = setTimeout(() => {
                setShowEmailReminder(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [emailStats]);

    // Handle modal close - save to sessionStorage
    const handleApprovalReminderClose = (open: boolean) => {
        setShowApprovalReminder(open);
        if (!open) {
            sessionStorage.setItem(APPROVAL_REMINDER_DISMISSED_KEY, 'true');
        }
    };

    const handleRevisionReminderClose = (open: boolean) => {
        setShowRevisionReminder(open);
        if (!open) {
            sessionStorage.setItem(REVISION_REMINDER_DISMISSED_KEY, 'true');
        }
    };

    const handleEmailReminderClose = (open: boolean) => {
        setShowEmailReminder(open);
        if (!open) {
            sessionStorage.setItem(EMAIL_REMINDER_DISMISSED_KEY, 'true');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="mb-2 h-7 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>
                <SkeletonTable />
            </div>
        );
    }

    const dashboardContent = (() => {
        switch (dashboardType) {
            case 'admin':
                return <AdminDashboard userName={userName} />;
            case 'unit':
                return <UnitDashboard userName={userName} />;
            case 'finance':
                return <FinanceDashboard userName={userName} />;
            case 'leadership':
                return <LeadershipDashboard userName={userName} />;
            case 'approver':
                return <ApproverDashboard userName={userName} />;
            case 'kasir':
                return <KasirDashboard userName={userName} />;
            case 'payment':
                return <PaymentDashboard userName={userName} />;
            default:
                return <UnitDashboard userName={userName} />;
        }
    })();

    return (
        <>
            {dashboardContent}

            {/* Approval Reminder Modal - shows for approver roles if there are pending approvals */}
            <ApprovalReminderModal
                open={showApprovalReminder}
                onOpenChange={handleApprovalReminderClose}
                pendingPengajuanCount={reminderStats?.pending_pengajuan_approval ?? 0}
                pendingLpjCount={reminderStats?.pending_lpj_approval ?? 0}
                pendingRapbsCount={reminderStats?.pending_rapbs_approval ?? 0}
            />

            {/* Revision Reminder Modal - shows for unit/substansi roles if there are revisions/rejections */}
            <RevisionReminderModal
                open={showRevisionReminder}
                onOpenChange={handleRevisionReminderClose}
                revisedPengajuanCount={reminderStats?.revised_pengajuan_count ?? 0}
                revisedLpjCount={reminderStats?.revised_lpj_count ?? 0}
                revisedRapbsCount={reminderStats?.revised_rapbs_count ?? 0}
                rejectedPengajuanCount={reminderStats?.rejected_pengajuan_count ?? 0}
                rejectedLpjCount={reminderStats?.rejected_lpj_count ?? 0}
                rejectedRapbsCount={reminderStats?.rejected_rapbs_count ?? 0}
            />

            {/* Email Reminder Modal - shows on login if there are unread emails */}
            <EmailReminderModal
                open={showEmailReminder}
                onOpenChange={handleEmailReminderClose}
                unreadEmailCount={emailStats?.unread_email_count ?? 0}
                unreadReplyCount={emailStats?.unread_reply_count ?? 0}
            />
        </>
    );
}
