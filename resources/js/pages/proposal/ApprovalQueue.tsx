import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    FileText,
    FileSpreadsheet,
    Clock,
    Building2,
    ChevronRight,
    Inbox,
    User,
    ChevronLeft,
    Loader2,
    AlertCircle,
} from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatRupiah } from '@/lib/currency';
import { formatDateTime } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ApprovalStage, UserRole, getApprovalStagesForRole, getStageLabel, getRapbsApprovalStagesForRole } from '@/types/enums';
import { useApprovalQueue, useLpjApprovalQueue } from '@/hooks/useApprovals';
import { usePerubahanAnggaranApprovalQueue } from '@/hooks/usePerubahanAnggaran';
import { useRapbsPendingApprovals } from '@/hooks/useRapbsApproval';
import type { PengajuanAnggaran, Lpj, PerubahanAnggaran, Rapbs } from '@/types/models';

const ITEMS_PER_PAGE = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabType = 'pengajuan' | 'lpj' | 'geser-anggaran' | 'rapbs';

interface QueueItem {
    id: number;
    type: 'pengajuan' | 'lpj' | 'geser-anggaran' | 'rapbs';
    nomor: string;
    perihal: string;
    unit: string;
    pengaju: string;
    total: number;
    tanggal_masuk: string;
    status: string;
    category: 'low' | 'high';
    current_approval_stage: ApprovalStage;
}

// Transform PengajuanAnggaran to QueueItem
function transformPengajuan(pengajuan: PengajuanAnggaran): QueueItem {
    return {
        id: pengajuan.id,
        type: 'pengajuan',
        nomor: pengajuan.nomor_pengajuan || '-',
        perihal: pengajuan.perihal || pengajuan.nama_pengajuan || '-',
        unit: pengajuan.unit?.nama || '-',
        pengaju: pengajuan.user?.name || '-',
        total: pengajuan.jumlah_pengajuan_total || 0,
        tanggal_masuk: pengajuan.created_at,
        status: typeof pengajuan.status_proses === 'string' ? pengajuan.status_proses : '-',
        category: (pengajuan.jumlah_pengajuan_total || 0) >= 10000000 ? 'high' : 'low',
        current_approval_stage: (pengajuan.current_approval_stage || ApprovalStage.StaffDirektur) as ApprovalStage,
    };
}

// Transform Lpj to QueueItem
function transformLpj(lpj: Lpj): QueueItem {
    const total = lpj.jumlah_realisasi || lpj.total_realisasi || 0;
    return {
        id: lpj.id,
        type: 'lpj',
        nomor: lpj.nomor_lpj || lpj.nomor || '-',
        perihal: lpj.perihal || `LPJ - ${lpj.pengajuan_anggaran?.perihal || '-'}`,
        unit: lpj.unit || lpj.pengajuan_anggaran?.unit?.nama || '-',
        pengaju: lpj.user?.name || '-',
        total: total,
        tanggal_masuk: lpj.created_at,
        status: typeof lpj.status === 'string' ? lpj.status : '-',
        category: total >= 10000000 ? 'high' : 'low',
        current_approval_stage: (lpj.current_approval_stage || ApprovalStage.StaffKeuangan) as ApprovalStage,
    };
}

// Transform PerubahanAnggaran to QueueItem
function transformPerubahanAnggaran(pa: PerubahanAnggaran): QueueItem {
    return {
        id: pa.id,
        type: 'geser-anggaran',
        nomor: pa.nomor_perubahan || '-',
        perihal: pa.perihal || 'Geser Anggaran',
        unit: pa.unit?.nama || '-',
        pengaju: pa.user?.name || pa.creator?.name || '-',
        total: pa.total_amount || 0,
        tanggal_masuk: pa.created_at,
        status: typeof pa.status === 'string' ? pa.status : '-',
        category: (pa.total_amount || 0) >= 10000000 ? 'high' : 'low',
        current_approval_stage: (pa.current_approval_stage || ApprovalStage.Direktur) as ApprovalStage,
    };
}

// Transform Rapbs to QueueItem
function transformRapbs(rapbs: Rapbs): QueueItem {
    const total = rapbs.total_anggaran || 0;
    return {
        id: rapbs.id,
        type: 'rapbs',
        nomor: rapbs.nomor_rapbs || `RAPBS-${rapbs.id}`,
        perihal: `RAPBS ${rapbs.tahun} - ${rapbs.unit?.nama || 'Unit'}`,
        unit: rapbs.unit?.nama || '-',
        pengaju: rapbs.creator?.name || '-',
        total: total,
        tanggal_masuk: rapbs.created_at,
        status: typeof rapbs.status === 'string' ? rapbs.status : '-',
        category: total >= 10000000 ? 'high' : 'low',
        current_approval_stage: (rapbs.current_approval_stage || ApprovalStage.Direktur) as ApprovalStage,
    };
}

// ---------------------------------------------------------------------------
// Queue Card Component
// ---------------------------------------------------------------------------

interface QueueCardProps {
    item: QueueItem;
    onClick: () => void;
    index: number;
}

function QueueCard({ item, onClick, index }: QueueCardProps) {
    const isHighValue = item.category === 'high';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={cn(
                'group relative cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all duration-200',
                'hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5',
                isHighValue ? 'border-l-4 border-l-amber-400' : 'border-slate-200',
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            item.type === 'pengajuan'
                                ? 'bg-blue-50 text-blue-700'
                                : item.type === 'lpj'
                                    ? 'bg-purple-50 text-purple-700'
                                    : item.type === 'geser-anggaran'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700',
                        )}>
                            {item.type === 'pengajuan' ? 'Pengajuan' : item.type === 'lpj' ? 'LPJ' : item.type === 'geser-anggaran' ? 'Geser Anggaran' : 'RAPBS'}
                        </span>
                        {isHighValue && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                ≥ 10 Juta
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.perihal}
                    </h3>
                    <p className="mt-0.5 text-sm text-blue-600 font-medium">
                        {item.nomor}
                    </p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(item.total)}
                    </p>
                </div>
            </div>

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{item.unit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{item.pengaju}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(item.tanggal_masuk)}</span>
                </div>
            </div>

            {/* Chevron indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5 text-blue-500" />
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Empty State Component
// ---------------------------------------------------------------------------

function EmptyQueue() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 mb-4">
                <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
                Tidak ada antrian
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Semua item sudah diproses. Bagus sekali!
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Pagination Component
// ---------------------------------------------------------------------------

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const visiblePages = pages.filter(page => {
        if (totalPages <= 5) return true;
        if (page === 1 || page === totalPages) return true;
        if (Math.abs(page - currentPage) <= 1) return true;
        return false;
    });

    const renderPageNumbers = () => {
        const result: React.ReactNode[] = [];
        let lastPage = 0;

        visiblePages.forEach((page) => {
            if (lastPage && page - lastPage > 1) {
                result.push(
                    <span key={`ellipsis-${page}`} className="px-2 text-slate-400">
                        ...
                    </span>
                );
            }
            result.push(
                <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all',
                        currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100',
                    )}
                >
                    {page}
                </button>
            );
            lastPage = page;
        });

        return result;
    };

    return (
        <div className="mt-6 flex items-center justify-center gap-1">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                    currentPage === 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-100',
                )}
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            {renderPageNumbers()}
            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                    currentPage === totalPages
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-100',
                )}
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// Roles that can approve Geser Anggaran
const GESER_ANGGARAN_ROLES = [
    UserRole.Direktur,
    UserRole.Sekretariat,
    UserRole.Sekretaris,
    UserRole.Ketua1, // Wakil Ketua
    UserRole.Ketum,
    UserRole.Keuangan,
    UserRole.Bendahara,
    UserRole.Admin, // Admin can see everything
];

// Roles that can approve RAPBS
const RAPBS_APPROVAL_ROLES = [
    UserRole.Direktur,
    UserRole.Sekretariat,
    UserRole.Sekretaris,
    UserRole.Ketua1, // Wakil Ketua
    UserRole.Ketum,
    UserRole.Keuangan,
    UserRole.Bendahara, // Final approver
    UserRole.Admin, // Admin can see everything
];

export default function ApprovalQueue() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('pengajuan');
    const [currentPage, setCurrentPage] = useState(1);

    // Get approval stages that current user can approve
    const userRole = user?.role as UserRole | undefined;
    const approverStages = userRole ? getApprovalStagesForRole(userRole) : null;

    // Roles that don't handle LPJ approval (using string values for reliable comparison)
    const lpjExcludedRoleValues: string[] = [
        'kasir',
        'payment',
        'sekretaris',
        'ketua-1',    // Wakil Ketua (Ketua1)
        'ketum',      // Ketua Umum
        'bendahara',
    ];
    const showLpjTab = userRole ? !lpjExcludedRoleValues.includes(String(userRole)) : false;

    // Check if user can see Geser Anggaran tab
    const showGeserAnggaranTab = userRole && GESER_ANGGARAN_ROLES.includes(userRole);

    // Check if user can see RAPBS tab
    const showRapbsTab = userRole && RAPBS_APPROVAL_ROLES.includes(userRole);

    // Fetch data from API
    const {
        data: pengajuanResponse,
        isLoading: isPengajuanLoading,
        isError: isPengajuanError,
    } = useApprovalQueue({ page: 1, per_page: 100 });

    // Only fetch LPJ data if user can handle LPJ
    const {
        data: lpjResponse,
        isLoading: isLpjLoading,
        isError: isLpjError,
    } = useLpjApprovalQueue({ page: 1, per_page: 100 }, { enabled: showLpjTab });

    // Fetch Geser Anggaran data if user can handle it
    const {
        data: geserAnggaranResponse,
        isLoading: isGeserAnggaranLoading,
        isError: isGeserAnggaranError,
    } = usePerubahanAnggaranApprovalQueue();

    // Fetch RAPBS data if user can handle it
    const {
        data: rapbsResponse,
        isLoading: isRapbsLoading,
        isError: isRapbsError,
    } = useRapbsPendingApprovals({ page: 1, per_page: 100 }, { enabled: showRapbsTab });

    // Transform API data to QueueItem format
    const pengajuanData = useMemo(() => {
        if (!pengajuanResponse?.data) return [];
        return pengajuanResponse.data.map(transformPengajuan);
    }, [pengajuanResponse]);

    const lpjData = useMemo(() => {
        if (!lpjResponse?.data) return [];
        return lpjResponse.data.map(transformLpj);
    }, [lpjResponse]);

    const geserAnggaranData = useMemo(() => {
        // geserAnggaranResponse is already an array (service returns data.data directly)
        if (!geserAnggaranResponse || !Array.isArray(geserAnggaranResponse)) return [];
        return geserAnggaranResponse.map(transformPerubahanAnggaran);
    }, [geserAnggaranResponse]);

    const rapbsData = useMemo(() => {
        if (!rapbsResponse?.data) return [];
        return rapbsResponse.data.map(transformRapbs);
    }, [rapbsResponse]);

    const data = activeTab === 'pengajuan'
        ? pengajuanData
        : activeTab === 'lpj'
            ? lpjData
            : activeTab === 'geser-anggaran'
                ? geserAnggaranData
                : rapbsData;
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(start, start + ITEMS_PER_PAGE);
    }, [data, currentPage]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset page when switching tabs
    };

    const handleCardClick = (item: QueueItem) => {
        if (item.type === 'geser-anggaran') {
            navigate(`/perubahan-anggaran/${item.id}`);
        } else if (item.type === 'rapbs') {
            navigate(`/planning/rapbs/${item.id}`);
        } else {
            navigate(`/approvals/${item.id}?type=${item.type}`);
        }
    };

    // Get stage label for display
    const stageLabel = approverStages && approverStages.length === 1
        ? getStageLabel(approverStages[0])
        : userRole === UserRole.Admin
            ? 'Semua Tahap'
            : 'Beberapa Tahap';

    // Only check loading/error for tabs user can see
    const isLoading = isPengajuanLoading || (showLpjTab && isLpjLoading) || (showGeserAnggaranTab && isGeserAnggaranLoading) || (showRapbsTab && isRapbsLoading);
    const isError = isPengajuanError || (showLpjTab && isLpjError) || (showGeserAnggaranTab && isGeserAnggaranError) || (showRapbsTab && isRapbsError);

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
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-sm text-red-600">Gagal memuat data antrian</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Antrian Persetujuan"
                        description={`Tahap: ${stageLabel} — Klik item untuk melihat detail dan memproses persetujuan`}
                    />
                </motion.div>

                {/* Summary cards */}
                <motion.div variants={staggerItem} className={cn(
                    'mb-6 grid gap-4',
                    // Calculate grid columns based on visible tabs
                    (() => {
                        const visibleCount = 1 + (showLpjTab ? 1 : 0) + (showGeserAnggaranTab ? 1 : 0) + (showRapbsTab ? 1 : 0);
                        if (visibleCount >= 4) return 'sm:grid-cols-2 lg:grid-cols-4';
                        if (visibleCount === 3) return 'sm:grid-cols-3';
                        if (visibleCount === 2) return 'sm:grid-cols-2';
                        return 'max-w-md';
                    })()
                )}>
                    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pengajuan Menunggu</p>
                                <p className="mt-1 text-3xl font-bold text-blue-600">{pengajuanData.length}</p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    {showLpjTab && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">LPJ Menunggu</p>
                                    <p className="mt-1 text-3xl font-bold text-purple-600">{lpjData.length}</p>
                                </div>
                                <div className="rounded-full bg-purple-100 p-3">
                                    <FileText className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    )}
                    {showGeserAnggaranTab && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Geser Anggaran</p>
                                    <p className="mt-1 text-3xl font-bold text-emerald-600">{geserAnggaranData.length}</p>
                                </div>
                                <div className="rounded-full bg-emerald-100 p-3">
                                    <FileText className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    )}
                    {showRapbsTab && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">RAPBS Menunggu</p>
                                    <p className="mt-1 text-3xl font-bold text-amber-600">{rapbsData.length}</p>
                                </div>
                                <div className="rounded-full bg-amber-100 p-3">
                                    <FileSpreadsheet className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Tabs - Only show if user can see multiple tabs */}
                {(showLpjTab || showGeserAnggaranTab || showRapbsTab) && (
                    <motion.div variants={staggerItem} className="mb-6">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleTabChange('pengajuan')}
                                className={cn(
                                    'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                    activeTab === 'pengajuan'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                )}
                            >
                                Pengajuan
                                <span className={cn(
                                    'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                    activeTab === 'pengajuan'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-600',
                                )}>
                                    {pengajuanData.length}
                                </span>
                            </button>
                            {showLpjTab && (
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('lpj')}
                                    className={cn(
                                        'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                        activeTab === 'lpj'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                    )}
                                >
                                    LPJ
                                    <span className={cn(
                                        'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                        activeTab === 'lpj'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-slate-600',
                                    )}>
                                        {lpjData.length}
                                    </span>
                                </button>
                            )}
                            {showGeserAnggaranTab && (
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('geser-anggaran')}
                                    className={cn(
                                        'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                        activeTab === 'geser-anggaran'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                    )}
                                >
                                    Geser Anggaran
                                    <span className={cn(
                                        'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                        activeTab === 'geser-anggaran'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-slate-600',
                                    )}>
                                        {geserAnggaranData.length}
                                    </span>
                                </button>
                            )}
                            {showRapbsTab && (
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('rapbs')}
                                    className={cn(
                                        'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                        activeTab === 'rapbs'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                    )}
                                >
                                    RAPBS
                                    <span className={cn(
                                        'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                        activeTab === 'rapbs'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-slate-600',
                                    )}>
                                        {rapbsData.length}
                                    </span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Queue cards - 2 columns grid */}
                <motion.div variants={staggerItem}>
                    {data.length === 0 ? (
                        <EmptyQueue />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                {paginatedData.map((item, index) => (
                                    <QueueCard
                                        key={`${item.type}-${item.id}`}
                                        item={item}
                                        onClick={() => handleCardClick(item)}
                                        index={index}
                                    />
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
