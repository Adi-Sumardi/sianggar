import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
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
import { getRapbsApprovalStageLabel, getRapbsStatusLabel, getRapbsStatusColor } from '@/types/enums';
import { useRapbsPendingApprovals } from '@/hooks/useRapbsApproval';
import type { Rapbs } from '@/types/models';

const ITEMS_PER_PAGE = 6;

// ---------------------------------------------------------------------------
// Queue Card Component
// ---------------------------------------------------------------------------

interface QueueCardProps {
    item: Rapbs;
    onClick: () => void;
    index: number;
}

function QueueCard({ item, onClick, index }: QueueCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={cn(
                'group relative cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all duration-200',
                'hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5',
                'border-slate-200',
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            RAPBS
                        </span>
                        <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getRapbsStatusColor(item.status),
                        )}>
                            {getRapbsStatusLabel(item.status)}
                        </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.unit?.nama || 'Unit'} - Tahun {item.tahun}
                    </h3>
                    <p className="mt-0.5 text-sm text-blue-600 font-medium">
                        Tahap: {getRapbsApprovalStageLabel(item.current_approval_stage)}
                    </p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(item.total_anggaran)}
                    </p>
                    <p className="text-xs text-slate-500">
                        {item.items_count ?? 0} item
                    </p>
                </div>
            </div>

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{item.unit?.nama || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{item.submitter?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{item.submitted_at ? formatDateTime(item.submitted_at) : '-'}</span>
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
                Tidak ada antrian RAPBS
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Semua RAPBS sudah diproses. Bagus sekali!
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

export default function RapbsApprovalQueue() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch pending RAPBS approvals
    const {
        data: pendingResponse,
        isLoading,
        isError,
    } = useRapbsPendingApprovals({ page: 1, per_page: 100 });

    const rapbsData = pendingResponse?.data ?? [];
    const totalPages = Math.ceil(rapbsData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return rapbsData.slice(start, start + ITEMS_PER_PAGE);
    }, [rapbsData, currentPage]);

    const handleCardClick = (item: Rapbs) => {
        navigate(`/planning/rapbs/${item.id}`);
    };

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
                    <p className="text-sm text-red-600">Gagal memuat data antrian RAPBS</p>
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
                        title="Persetujuan RAPBS"
                        description="Daftar RAPBS yang menunggu persetujuan Anda"
                    />
                </motion.div>

                {/* Summary card */}
                <motion.div variants={staggerItem} className="mb-6 max-w-md">
                    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">RAPBS Menunggu</p>
                                <p className="mt-1 text-3xl font-bold text-emerald-600">{rapbsData.length}</p>
                            </div>
                            <div className="rounded-full bg-emerald-100 p-3">
                                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Queue cards */}
                <motion.div variants={staggerItem}>
                    {rapbsData.length === 0 ? (
                        <EmptyQueue />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                {paginatedData.map((item, index) => (
                                    <QueueCard
                                        key={item.id}
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
