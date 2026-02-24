import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
    ArrowLeft,
    FileSpreadsheet,
    Building2,
    Calendar,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Loader2,
    AlertCircle,
    Send,
    List,
    BarChart3,
    ChevronRight,
} from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDateTime } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import {
    RapbsApprovalStage,
    getRapbsStatusLabel,
    getRapbsStatusColor,
} from '@/types/enums';
import {
    useRapbs,
    useSubmitRapbs,
    useApproveRapbs,
    useReviseRapbs,
    useRejectRapbs,
} from '@/hooks/useRapbsApproval';
import { useRapbsList as useRapbsAggregated } from '@/hooks/useBudget';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatAcademicYear(year: string): { previous: string; current: string } {
    // Handle academic year format (e.g., "2025/2026")
    if (year.includes('/')) {
        const [startYear] = year.split('/').map(Number);
        return {
            previous: `${startYear - 1}/${startYear}`,
            current: year,
        };
    }
    // Legacy format: single year (e.g., "2026")
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    return {
        previous: `${yearNum - 1}/${yearNum}`,
        current: `${yearNum}/${yearNum + 1}`,
    };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApprovalTimelineItem {
    stage: RapbsApprovalStage;
    label: string;
    status: 'completed' | 'current' | 'pending' | 'skipped';
    approver?: string;
    approvedAt?: string;
    notes?: string;
}

// ---------------------------------------------------------------------------
// Approval Timeline Component
// ---------------------------------------------------------------------------

interface ApprovalTimelineProps {
    items: ApprovalTimelineItem[];
}

function ApprovalTimeline({ items }: ApprovalTimelineProps) {
    return (
        <div className="flex flex-wrap items-center gap-1">
            {items.map((item, index) => (
                <div key={item.stage} className="flex items-center gap-1">
                    <div className="group relative flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
                        style={{
                            borderColor: item.status === 'completed' ? '#d1fae5' : item.status === 'current' ? '#bfdbfe' : '#e2e8f0',
                            backgroundColor: item.status === 'completed' ? '#ecfdf5' : item.status === 'current' ? '#eff6ff' : '#f8fafc',
                        }}
                    >
                        <div
                            className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
                                item.status === 'completed' && 'bg-emerald-500 text-white',
                                item.status === 'current' && 'bg-blue-500 text-white ring-2 ring-blue-300',
                                item.status === 'pending' && 'bg-slate-200 text-slate-500',
                                item.status === 'skipped' && 'bg-slate-100 text-slate-400',
                            )}
                        >
                            {item.status === 'completed' ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : item.status === 'current' ? (
                                <Clock className="h-3 w-3" />
                            ) : (
                                index + 1
                            )}
                        </div>
                        <span className={cn(
                            'text-xs font-medium whitespace-nowrap',
                            item.status === 'completed' && 'text-emerald-700',
                            item.status === 'current' && 'text-blue-700',
                            item.status === 'pending' && 'text-slate-500',
                            item.status === 'skipped' && 'text-slate-400',
                        )}>
                            {item.label}
                        </span>

                        {/* Tooltip on hover */}
                        {(item.approver || item.notes) && (
                            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {item.approver && (
                                    <p className="whitespace-nowrap text-xs text-slate-600">
                                        {item.approver} - {item.approvedAt}
                                    </p>
                                )}
                                {item.notes && (
                                    <p className="whitespace-nowrap text-xs italic text-slate-400">
                                        &ldquo;{item.notes}&rdquo;
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {index < items.length - 1 && (
                        <ChevronRight className={cn(
                            'h-4 w-4 shrink-0',
                            item.status === 'completed' ? 'text-emerald-400' : 'text-slate-300',
                        )} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type TabType = 'items' | 'rekap';

export default function RapbsDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [reviseDialogOpen, setReviseDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('items');

    const rapbsId = id ? parseInt(id) : null;
    const { data: rapbs, isLoading, isError } = useRapbs(rapbsId);

    // Fetch aggregated budget data for Rekap Mata Anggaran tab
    const aggregatedParams = useMemo(() => ({
        unit_id: rapbs?.unit_id,
        tahun: rapbs?.tahun,
    }), [rapbs?.unit_id, rapbs?.tahun]);

    const { data: rapbsAggregated, isLoading: isLoadingAggregated } = useRapbsAggregated(
        rapbs?.unit_id && rapbs?.tahun ? aggregatedParams : null
    );

    // Get the unit data from aggregated response
    const unitRekapData = rapbsAggregated?.find(u => u.unit_id === rapbs?.unit_id);

    // Calculate academic years
    const academicYears = rapbs?.tahun ? formatAcademicYear(rapbs.tahun) : { previous: '', current: '' };

    const submitMutation = useSubmitRapbs();
    const approveMutation = useApproveRapbs();
    const reviseMutation = useReviseRapbs();
    const rejectMutation = useRejectRapbs();

    const isMutating = submitMutation.isPending || approveMutation.isPending || reviseMutation.isPending || rejectMutation.isPending;

    // Build timeline from approvals and expected flow
    const timelineItems: ApprovalTimelineItem[] = [];
    if (rapbs?.expected_flow) {
        rapbs.expected_flow.forEach((stage) => {
            const approval = rapbs.approvals?.find(a => a.stage === stage.value);
            let status: ApprovalTimelineItem['status'] = 'pending';

            if (approval) {
                if (approval.status === 'approved') {
                    status = 'completed';
                } else if (approval.status === 'pending') {
                    status = 'current';
                }
            } else if (rapbs.current_approval_stage === stage.value) {
                status = 'current';
            }

            timelineItems.push({
                stage: stage.value as RapbsApprovalStage,
                label: stage.label,
                status,
                approver: approval?.user?.name,
                approvedAt: approval?.acted_at != null ? formatDateTime(approval.acted_at) : undefined,
                notes: approval?.notes ?? undefined,
            });
        });
    }

    // Check if current user can approve (from backend)
    const canApprove = rapbs?.can_approve_action === true;
    const canSubmit = rapbs?.can_submit;

    // Check if total anggaran exceeds total plafon (cannot submit if over budget)
    const totalPlafon = unitRekapData?.mata_anggarans.reduce((sum, ma) => sum + (ma.plafon_apbs ?? 0), 0) ?? 0;
    const totalAnggaran = unitRekapData?.mata_anggarans.reduce((sum, ma) => sum + ma.total, 0) ?? 0;
    const isOverBudget = totalPlafon > 0 && totalAnggaran > totalPlafon;

    const handleSubmit = async () => {
        if (!rapbsId) return;
        try {
            await submitMutation.mutateAsync(rapbsId);
            toast.success('RAPBS berhasil diajukan');
            setSubmitDialogOpen(false);
        } catch {
            toast.error('Gagal mengajukan RAPBS');
        }
    };

    const handleApprove = async () => {
        if (!rapbsId) return;
        try {
            await approveMutation.mutateAsync({ id: rapbsId, dto: { notes: notes || undefined } });
            toast.success('RAPBS berhasil disetujui');
            setApproveDialogOpen(false);
            setNotes('');
            navigate('/planning/rapbs-approvals');
        } catch {
            toast.error('Gagal menyetujui RAPBS');
        }
    };

    const handleRevise = async () => {
        if (!rapbsId || !notes.trim()) {
            toast.error('Catatan revisi harus diisi');
            return;
        }
        try {
            await reviseMutation.mutateAsync({ id: rapbsId, dto: { notes } });
            toast.success('RAPBS dikembalikan untuk revisi');
            setReviseDialogOpen(false);
            setNotes('');
        } catch {
            toast.error('Gagal mengembalikan RAPBS');
        }
    };

    const handleReject = async () => {
        if (!rapbsId || !notes.trim()) {
            toast.error('Alasan penolakan harus diisi');
            return;
        }
        try {
            await rejectMutation.mutateAsync({ id: rapbsId, dto: { notes } });
            toast.success('RAPBS ditolak');
            setRejectDialogOpen(false);
            setNotes('');
            navigate('/planning/rapbs-approvals');
        } catch {
            toast.error('Gagal menolak RAPBS');
        }
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
    if (isError || !rapbs) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-sm text-red-600">Gagal memuat data RAPBS</p>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali
                    </button>
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
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <div className="flex flex-wrap items-center gap-3 mb-6 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Detail RAPBS</h1>
                            <p className="text-sm text-slate-500">
                                {rapbs.unit?.nama} - Tahun {rapbs.tahun}
                            </p>
                        </div>
                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                            <span className={cn(
                                'rounded-full px-3 py-1 text-sm font-medium',
                                getRapbsStatusColor(rapbs.status),
                            )}>
                                {getRapbsStatusLabel(rapbs.status)}
                            </span>
                            {canSubmit && (
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => setSubmitDialogOpen(true)}
                                        disabled={isMutating || isOverBudget}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="h-4 w-4" />
                                        Ajukan
                                    </button>
                                    {isOverBudget && (
                                        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                            <p className="font-semibold">Total Anggaran melebihi Total Plafon</p>
                                            <p className="mt-1">Sesuaikan anggaran agar tidak melebihi plafon sebelum mengajukan RAPBS.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canApprove && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setApproveDialogOpen(true)}
                                        disabled={isMutating}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Setujui
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviseDialogOpen(true)}
                                        disabled={isMutating}
                                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Revisi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRejectDialogOpen(true)}
                                        disabled={isMutating}
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Tolak
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Alur Persetujuan - horizontal */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-sm font-semibold text-slate-900 mr-2">Alur Persetujuan</h3>
                            <ApprovalTimeline items={timelineItems} />
                        </div>
                    </div>
                </motion.div>

                {/* Warning: Over Budget */}
                {canSubmit && isOverBudget && (
                    <motion.div variants={staggerItem}>
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                            <div>
                                <p className="text-sm font-semibold text-red-700">
                                    Total Anggaran melebihi Total Plafon
                                </p>
                                <p className="mt-0.5 text-sm text-red-600">
                                    Total Anggaran ({formatRupiah(totalAnggaran)}) melebihi Total Plafon ({formatRupiah(totalPlafon)}). Sesuaikan anggaran agar tidak melebihi plafon sebelum mengajukan RAPBS.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Keterangan */}
                {rapbs.keterangan && (
                    <motion.div variants={staggerItem}>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
                            <p className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Keterangan:</span>{' '}
                                {rapbs.keterangan}
                            </p>
                        </div>
                    </motion.div>
                )}

                <div className="space-y-6">
                    {/* Info cards */}
                    <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Unit</p>
                                        <p className="font-semibold text-slate-900">{rapbs.unit?.nama}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2">
                                        <Calendar className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Tahun Anggaran</p>
                                        <p className="font-semibold text-slate-900">{rapbs.tahun}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-purple-100 p-2">
                                        <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total Anggaran</p>
                                        <p className="font-semibold text-slate-900">{formatRupiah(rapbs.total_anggaran)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2">
                                        <User className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Pengaju</p>
                                        <p className="font-semibold text-slate-900">{rapbs.submitter?.name || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tabs */}
                        <motion.div variants={staggerItem}>
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                {/* Tab Navigation */}
                                <div className="border-b border-slate-200 bg-slate-50">
                                    <nav className="flex -mb-px" aria-label="Tabs">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('items')}
                                            className={cn(
                                                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                                                activeTab === 'items'
                                                    ? 'border-blue-500 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                            )}
                                        >
                                            <List className="h-4 w-4" />
                                            Item Detail
                                            <span className={cn(
                                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                                activeTab === 'items'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {rapbs.items?.length ?? 0}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('rekap')}
                                            className={cn(
                                                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                                                activeTab === 'rekap'
                                                    ? 'border-blue-500 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                            )}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Rekap Mata Anggaran
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'items' ? (
                                    /* Item Detail Tab */
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        No
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Mata Anggaran
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Volume
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Harga Satuan
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Jumlah
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {rapbs.items?.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 text-slate-500">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.mata_anggaran ? (
                                                                <>
                                                                    <p className="font-medium text-slate-900">
                                                                        {item.mata_anggaran.kode}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {item.mata_anggaran.nama}
                                                                    </p>
                                                                    {item.sub_mata_anggaran && (
                                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                                            Sub: {item.sub_mata_anggaran.kode} - {item.sub_mata_anggaran.nama}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-slate-700">
                                                            <span className="font-medium">{item.volume}</span>
                                                            <span className="text-slate-500 ml-1">{item.satuan}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-700">
                                                            {formatRupiah(item.harga_satuan)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                            {formatRupiah(item.jumlah)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">
                                                        Total Anggaran
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-lg text-slate-900">
                                                        {formatRupiah(rapbs.total_anggaran)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    /* Rekap Mata Anggaran Tab */
                                    <div>
                                        {isLoadingAggregated ? (
                                            <div className="flex h-32 items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                            </div>
                                        ) : !unitRekapData || unitRekapData.mata_anggarans.length === 0 ? (
                                            <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                                                Tidak ada data rekap mata anggaran
                                            </div>
                                        ) : (
                                            <>
                                                {/* Summary Cards */}
                                                {(() => {
                                                    const totalPlafon = unitRekapData.mata_anggarans.reduce((sum, ma) => sum + (ma.plafon_apbs ?? 0), 0);
                                                    const totalAnggaran = unitRekapData.mata_anggarans.reduce((sum, ma) => sum + ma.total, 0);
                                                    const selisih = totalPlafon - totalAnggaran;
                                                    const isOverBudget = totalAnggaran > totalPlafon;

                                                    return (
                                                        <div className={cn(
                                                            "mx-4 mt-4 rounded-lg border p-4",
                                                            isOverBudget
                                                                ? "border-red-200 bg-red-50"
                                                                : "border-emerald-200 bg-emerald-50"
                                                        )}>
                                                            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Total Plafon {academicYears.current}</p>
                                                                    <p className="text-lg font-bold text-slate-900">{formatRupiah(totalPlafon)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Total Anggaran</p>
                                                                    <p className={cn(
                                                                        "text-lg font-bold",
                                                                        isOverBudget ? "text-red-700" : "text-emerald-700"
                                                                    )}>
                                                                        {formatRupiah(totalAnggaran)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Selisih</p>
                                                                    <p className={cn(
                                                                        "text-lg font-bold",
                                                                        isOverBudget ? "text-red-700" : "text-emerald-700"
                                                                    )}>
                                                                        {formatRupiah(selisih)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex justify-center">
                                                                <span className={cn(
                                                                    "rounded-full px-3 py-1 text-xs font-medium",
                                                                    isOverBudget
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-emerald-100 text-emerald-700"
                                                                )}>
                                                                    {isOverBudget ? "Melebihi Plafon" : "Dalam Plafon"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Rekap Table */}
                                                <div className="overflow-x-auto mt-4">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Kode
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Mata Anggaran
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    APBS {academicYears.previous}
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Asumsi Realisasi {academicYears.previous}
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Plafon {academicYears.current}
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Anggaran
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                    Selisih
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {unitRekapData.mata_anggarans.map((ma) => {
                                                                const selisih = (ma.plafon_apbs ?? 0) - ma.total;
                                                                const isNegative = selisih < 0;

                                                                return (
                                                                    <tr key={ma.id} className="hover:bg-slate-50/50">
                                                                        <td className="px-4 py-3 font-mono text-xs text-blue-600">
                                                                            {ma.kode}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-slate-700">
                                                                            {ma.nama}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-xs text-slate-700">
                                                                            {formatRupiah(ma.apbs_tahun_lalu ?? 0)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-xs text-slate-700">
                                                                            {formatRupiah(ma.asumsi_realisasi ?? 0)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-xs font-medium text-slate-900">
                                                                            {formatRupiah(ma.plafon_apbs ?? 0)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-xs font-medium text-slate-900">
                                                                            {formatRupiah(ma.total)}
                                                                        </td>
                                                                        <td className={cn(
                                                                            "px-4 py-3 text-right text-xs font-medium",
                                                                            isNegative ? "text-red-600" : "text-emerald-600"
                                                                        )}>
                                                                            {formatRupiah(selisih)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            {(() => {
                                                                const totalPlafon = unitRekapData.mata_anggarans.reduce((sum, ma) => sum + (ma.plafon_apbs ?? 0), 0);
                                                                const totalAnggaran = unitRekapData.mata_anggarans.reduce((sum, ma) => sum + ma.total, 0);
                                                                const totalSelisih = totalPlafon - totalAnggaran;
                                                                const isOverBudget = totalAnggaran > totalPlafon;

                                                                return (
                                                                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                                                                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">
                                                                            Total
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                                            {formatRupiah(totalPlafon)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                                            {formatRupiah(totalAnggaran)}
                                                                        </td>
                                                                        <td className={cn(
                                                                            "px-4 py-3 text-right font-bold",
                                                                            isOverBudget ? "text-red-600" : "text-emerald-600"
                                                                        )}>
                                                                            {formatRupiah(totalSelisih)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })()}
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                </div>
            </motion.div>

            {/* Submit Dialog */}
            <ConfirmDialog
                open={submitDialogOpen}
                onOpenChange={setSubmitDialogOpen}
                title="Ajukan RAPBS"
                description="Apakah Anda yakin ingin mengajukan RAPBS ini untuk persetujuan?"
                confirmLabel={submitMutation.isPending ? 'Mengajukan...' : 'Ajukan'}
                onConfirm={handleSubmit}
                isLoading={submitMutation.isPending}
            />

            {/* Approve Dialog */}
            <ConfirmDialog
                open={approveDialogOpen}
                onOpenChange={setApproveDialogOpen}
                title="Setujui RAPBS"
                description="Apakah Anda yakin ingin menyetujui RAPBS ini?"
                confirmLabel={approveMutation.isPending ? 'Menyetujui...' : 'Setujui'}
                onConfirm={handleApprove}
                isLoading={approveMutation.isPending}
            >
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Catatan (opsional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tambahkan catatan..."
                        rows={2}
                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </ConfirmDialog>

            {/* Revise Dialog */}
            <ConfirmDialog
                open={reviseDialogOpen}
                onOpenChange={setReviseDialogOpen}
                title="Kembalikan untuk Revisi"
                description="RAPBS akan dikembalikan ke pengaju untuk direvisi."
                confirmLabel={reviseMutation.isPending ? 'Mengembalikan...' : 'Kembalikan'}
                variant="destructive"
                onConfirm={handleRevise}
                isLoading={reviseMutation.isPending}
            >
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Catatan Revisi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Jelaskan apa yang perlu direvisi..."
                        rows={3}
                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </ConfirmDialog>

            {/* Reject Dialog */}
            <ConfirmDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                title="Tolak RAPBS"
                description="RAPBS akan ditolak dan tidak dapat dilanjutkan."
                confirmLabel={rejectMutation.isPending ? 'Menolak...' : 'Tolak'}
                variant="destructive"
                onConfirm={handleReject}
                isLoading={rejectMutation.isPending}
            >
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Alasan Penolakan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Jelaskan alasan penolakan..."
                        rows={3}
                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </ConfirmDialog>
        </PageTransition>
    );
}
