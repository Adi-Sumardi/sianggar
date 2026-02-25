import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Download,
    FileText,
    Printer,
    Loader2,
    CheckCircle2,
    XCircle,
    RotateCcw,
    ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RevisionCommentThread } from '@/components/common/RevisionCommentThread';
import { LpjApprovalTimeline } from '@/components/lpj/LpjApprovalTimeline';
import { LpjValidationDialog } from '@/components/lpj/LpjValidationDialog';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { LpjApprovalStage, LpjStatus } from '@/types/enums';
import { useAuth } from '@/hooks/useAuth';
import { useLpj, useValidateLpj, useApproveLpj, useReviseLpj, useRejectLpj } from '@/hooks/useLpj';
import type { ValidateLpjDTO, ReviseLpjDTO, RejectLpjDTO } from '@/types/api';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'info' | 'approval' | 'lampiran';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LpjDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('info');

    // Dialog states
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showReviseDialog, setShowReviseDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [reviseNotes, setReviseNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [approveNotes, setApproveNotes] = useState('');

    // Fetch LPJ data
    const lpjId = id ? parseInt(id, 10) : null;
    const { data: lpj, isLoading, isError, error } = useLpj(lpjId);

    // Mutations
    const validateMutation = useValidateLpj();
    const approveMutation = useApproveLpj();
    const reviseMutation = useReviseLpj();
    const rejectMutation = useRejectLpj();

    // Check if current user can approve the current stage
    const canApprove = () => {
        if (!lpj || !user || !lpj.current_approval_stage) return false;

        const currentStage = lpj.current_approval_stage as LpjApprovalStage;
        const roleStageMapping: Record<string, LpjApprovalStage[]> = {
            'staff-keuangan': [LpjApprovalStage.StaffKeuangan],
            'direktur': [LpjApprovalStage.Direktur],
            'kabag-sdm-umum': [LpjApprovalStage.KabagSdmUmum],
            'sekretariat': [LpjApprovalStage.KabagSekretariat],
            'keuangan': [LpjApprovalStage.Keuangan],
            'admin': Object.values(LpjApprovalStage),
        };

        const allowedStages = roleStageMapping[user.role] || [];
        return allowedStages.includes(currentStage);
    };

    const isStaffKeuanganStage = lpj?.current_approval_stage === LpjApprovalStage.StaffKeuangan;

    // Handlers
    const handleValidate = (dto: ValidateLpjDTO) => {
        if (!lpjId) return;
        validateMutation.mutate(
            { id: lpjId, dto },
            {
                onSuccess: () => {
                    toast.success('LPJ berhasil divalidasi');
                    setShowValidationDialog(false);
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Gagal memvalidasi LPJ');
                },
            },
        );
    };

    const handleApprove = () => {
        if (!lpjId) return;
        approveMutation.mutate(
            { id: lpjId, dto: { notes: approveNotes || undefined } },
            {
                onSuccess: () => {
                    toast.success('LPJ berhasil disetujui');
                    setShowApproveDialog(false);
                    setApproveNotes('');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Gagal menyetujui LPJ');
                },
            },
        );
    };

    const handleRevise = () => {
        if (!lpjId || !reviseNotes.trim()) return;
        reviseMutation.mutate(
            { id: lpjId, dto: { notes: reviseNotes } as ReviseLpjDTO },
            {
                onSuccess: () => {
                    toast.success('LPJ dikembalikan untuk revisi');
                    setShowReviseDialog(false);
                    setReviseNotes('');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Gagal mengirim permintaan revisi');
                },
            },
        );
    };

    const handleReject = () => {
        if (!lpjId || !rejectNotes.trim()) return;
        rejectMutation.mutate(
            { id: lpjId, dto: { notes: rejectNotes } as RejectLpjDTO },
            {
                onSuccess: () => {
                    toast.success('LPJ telah ditolak');
                    setShowRejectDialog(false);
                    setRejectNotes('');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Gagal menolak LPJ');
                },
            },
        );
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'info', label: 'Informasi' },
        { key: 'approval', label: 'Approval' },
        { key: 'lampiran', label: 'Lampiran' },
    ];

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
    if (isError || !lpj) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data LPJ'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/lpj')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke daftar LPJ
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
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Detail LPJ"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/lpj')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                {/* Header card */}
                <motion.div
                    variants={staggerItem}
                    className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-900">{lpj.perihal}</h2>
                                <StatusBadge status={lpj.proses as string} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                                {lpj.no_surat && (
                                    <span>No: <span className="font-medium text-blue-600">{lpj.no_surat}</span></span>
                                )}
                                <span>Unit: <span className="font-medium text-slate-700">{lpj.unit}</span></span>
                                <span>Tahun: <span className="font-medium text-slate-700">{lpj.tahun}</span></span>
                                {lpj.tgl_kegiatan && (
                                    <span>Tanggal: <span className="font-medium text-slate-700">{formatDate(lpj.tgl_kegiatan)}</span></span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-500">Total Pengajuan</p>
                            <p className="text-2xl font-bold text-blue-600">{formatRupiah(lpj.jumlah_pengajuan_total)}</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Realisasi: <span className="font-medium text-emerald-600">{formatRupiah(lpj.input_realisasi)}</span>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Linked pengajuan summary */}
                {lpj.pengajuan_anggaran && (
                    <motion.div
                        variants={staggerItem}
                        className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                        <h3 className="mb-2 text-sm font-semibold text-slate-700">Pengajuan Terkait</h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                            <span className="text-slate-500">
                                No: <span className="font-medium text-blue-600">{lpj.pengajuan_anggaran.nomor_pengajuan}</span>
                            </span>
                            <span className="text-slate-500">
                                Perihal: <span className="font-medium text-slate-700">{lpj.pengajuan_anggaran.perihal}</span>
                            </span>
                            <span className="text-slate-500">
                                Anggaran: <span className="font-medium text-slate-700">{formatRupiah(lpj.pengajuan_anggaran.jumlah_pengajuan_total)}</span>
                            </span>
                            <StatusBadge status={lpj.pengajuan_anggaran.status_proses as string} size="sm" />
                        </div>
                    </motion.div>
                )}

                {/* Tab navigation */}
                <motion.div variants={staggerItem} className="mb-4 print:hidden">
                    <div className="flex border-b border-slate-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'relative px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === tab.key
                                        ? 'text-blue-600'
                                        : 'text-slate-500 hover:text-slate-700',
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <motion.div
                                        layoutId="lpj-tab-indicator"
                                        className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab content */}
                <motion.div variants={staggerItem}>
                    {activeTab === 'info' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">Informasi LPJ</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">Total Anggaran</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-900">{formatRupiah(lpj.jumlah_pengajuan_total)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500">Total Realisasi</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-900">{formatRupiah(lpj.input_realisasi)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500">Sisa Anggaran</p>
                                    <p className="mt-0.5 text-sm font-medium text-emerald-600">
                                        {formatRupiah(lpj.jumlah_pengajuan_total - lpj.input_realisasi)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500">Persentase Penggunaan</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                                        {lpj.jumlah_pengajuan_total > 0
                                            ? ((lpj.input_realisasi / lpj.jumlah_pengajuan_total) * 100).toFixed(1)
                                            : 0}%
                                    </p>
                                </div>
                                {lpj.mata_anggaran && (
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Mata Anggaran</p>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{lpj.mata_anggaran}</p>
                                    </div>
                                )}
                                {lpj.no_mata_anggaran && (
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">No Mata Anggaran</p>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{lpj.no_mata_anggaran}</p>
                                    </div>
                                )}
                            </div>
                            {lpj.deskripsi_singkat && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-slate-500">Deskripsi Singkat</p>
                                    <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                        {lpj.deskripsi_singkat}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'approval' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Alur Persetujuan LPJ
                            </h3>
                            <LpjApprovalTimeline
                                stages={lpj.expected_stages || []}
                                validation={lpj.validation}
                            />
                        </div>
                    )}

                    {activeTab === 'lampiran' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Dokumen Lampiran
                            </h3>
                            {lpj.attachments && lpj.attachments.length > 0 ? (
                                <div className="space-y-2">
                                    {lpj.attachments.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                                        >
                                            <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-700">
                                                    {file.nama}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <a
                                                href={file.path}
                                                download
                                                className="rounded p-1.5 text-blue-500 transition-colors hover:bg-blue-50"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Tidak ada lampiran.</p>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    variants={staggerItem}
                    className="mt-6 flex flex-wrap items-center gap-2 print:hidden"
                >
                    {/* Print button - always visible */}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak
                    </button>

                    {/* Approval actions - only if user can approve */}
                    {canApprove() && (
                        <>
                            {/* Validate button for Staf Keuangan */}
                            {isStaffKeuanganStage ? (
                                <button
                                    type="button"
                                    onClick={() => setShowValidationDialog(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                                >
                                    <ClipboardCheck className="h-4 w-4" />
                                    Validasi
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowApproveDialog(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Setujui
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowReviseDialog(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Revisi
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowRejectDialog(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                            >
                                <XCircle className="h-4 w-4" />
                                Tolak
                            </button>
                        </>
                    )}
                </motion.div>
            </motion.div>

            {/* Revision Comment Thread */}
            {lpj && (
                <RevisionCommentThread docType="lpj" docId={lpj.id} className="mt-6" />
            )}

            {/* Validation Dialog (Staf Keuangan) */}
            <LpjValidationDialog
                open={showValidationDialog}
                onOpenChange={setShowValidationDialog}
                onSubmit={handleValidate}
                isLoading={validateMutation.isPending}
            />

            {/* Approve Dialog */}
            <ConfirmDialog
                open={showApproveDialog}
                onOpenChange={setShowApproveDialog}
                title="Setujui LPJ"
                description="Apakah Anda yakin ingin menyetujui LPJ ini?"
                confirmLabel="Setujui"
                variant="approve"
                onConfirm={handleApprove}
                isLoading={approveMutation.isPending}
            >
                <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Catatan (opsional)..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </ConfirmDialog>

            {/* Revise Dialog */}
            <ConfirmDialog
                open={showReviseDialog}
                onOpenChange={setShowReviseDialog}
                title="Minta Revisi LPJ"
                description="Berikan catatan mengenai apa yang perlu diperbaiki:"
                confirmLabel="Kirim Permintaan Revisi"
                variant="revise"
                onConfirm={handleRevise}
                isLoading={reviseMutation.isPending}
            >
                <textarea
                    value={reviseNotes}
                    onChange={(e) => setReviseNotes(e.target.value)}
                    placeholder="Tuliskan catatan revisi..."
                    rows={3}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </ConfirmDialog>

            {/* Reject Dialog */}
            <ConfirmDialog
                open={showRejectDialog}
                onOpenChange={setShowRejectDialog}
                title="Tolak LPJ"
                description="Berikan alasan penolakan LPJ ini:"
                confirmLabel="Tolak LPJ"
                variant="destructive"
                onConfirm={handleReject}
                isLoading={rejectMutation.isPending}
            >
                <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Tuliskan alasan penolakan..."
                    rows={3}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </ConfirmDialog>
        </PageTransition>
    );
}
