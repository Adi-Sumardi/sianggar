import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    RotateCcw,
    Loader2,
    AlertCircle,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    MessageCircle,
    FileText,
    Download,
    Eye,
    Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';

import { RevisionCommentThread } from '@/components/common/RevisionCommentThread';
import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileUpload } from '@/components/common/FileUpload';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/date';
import {
    usePerubahanAnggaran,
    usePerubahanAnggaranExpectedStages,
    useSubmitPerubahanAnggaran,
    useApprovePerubahanAnggaran,
    useRevisePerubahanAnggaran,
    useRejectPerubahanAnggaran,
    useUploadPerubahanAnggaranAttachment,
    useDeletePerubahanAnggaranAttachment,
} from '@/hooks/usePerubahanAnggaran';
import { useAuth } from '@/hooks/useAuth';
import type { PerubahanAnggaran, Approval, ExpectedStage } from '@/types/models';
import {
    PerubahanAnggaranStatus,
    ApprovalStatus,
    UserRole,
    getPerubahanAnggaranStatusLabel,
    getPerubahanAnggaranStatusColor,
    getStageLabel,
    getApprovalStagesForRole,
} from '@/types/enums';

// Roles that show Discussion button in detail page
// Direktur and Sekretariat use floating button instead
const SHOW_DISCUSSION_BUTTON_ROLES = [
    UserRole.Ketua1,      // Wakil Ketua
    UserRole.Sekretaris,
    UserRole.Ketum,       // Ketua Umum
    UserRole.Bendahara,
    UserRole.Keuangan,
];

// ---------------------------------------------------------------------------
// Timeline Component
// ---------------------------------------------------------------------------

function ApprovalTimeline({
    expectedStages,
    approvals,
}: {
    expectedStages: ExpectedStage[];
    approvals: Approval[];
}) {
    return (
        <div className="space-y-4">
            {expectedStages.map((stage, idx) => {
                const isLast = idx === expectedStages.length - 1;
                const approval = approvals.find((a) => a.stage === stage.stage);
                const stepNumber = idx + 1;

                // Determine status styling
                let bgColor = 'bg-gray-100';
                let textColor = 'text-gray-400';
                let borderColor = 'border-gray-200';
                let statusText = 'Menunggu';
                let StatusIcon = Clock;

                if (stage.status === 'approved') {
                    bgColor = 'bg-green-50';
                    textColor = 'text-green-600';
                    borderColor = 'border-green-200';
                    statusText = 'Disetujui';
                    StatusIcon = CheckCircle2;
                } else if (stage.status === 'current' || stage.status === 'pending') {
                    bgColor = 'bg-blue-50';
                    textColor = 'text-blue-600';
                    borderColor = 'border-blue-300';
                    statusText = 'Proses Saat Ini';
                    StatusIcon = Clock;
                } else if (stage.status === 'revised') {
                    bgColor = 'bg-amber-50';
                    textColor = 'text-amber-600';
                    borderColor = 'border-amber-200';
                    statusText = 'Revisi';
                    StatusIcon = RotateCcw;
                } else if (stage.status === 'rejected') {
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-600';
                    borderColor = 'border-red-200';
                    statusText = 'Ditolak';
                    StatusIcon = XCircle;
                }

                return (
                    <div key={stage.stage} className="relative">
                        {/* Connector line */}
                        {!isLast && (
                            <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-200" />
                        )}

                        <div className={`relative rounded-lg border ${borderColor} ${bgColor} p-4`}>
                            <div className="flex items-start gap-3">
                                {/* Step number */}
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${borderColor} bg-white`}>
                                    <span className={`text-sm font-bold ${textColor}`}>{stepNumber}</span>
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-semibold text-gray-900">{stage.label}</h4>
                                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusText}
                                        </div>
                                    </div>

                                    {approval?.approver && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            Oleh: {approval.approver.name}
                                        </p>
                                    )}

                                    {approval?.approved_at && (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {formatDateTime(approval.approved_at)}
                                        </p>
                                    )}

                                    {approval?.notes && (
                                        <div className="mt-2 rounded-md bg-white/80 p-2 border border-gray-200">
                                            <p className="text-sm text-gray-700 italic">"{approval.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Action Dialog Component
// ---------------------------------------------------------------------------

function ActionDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    confirmVariant = 'primary',
    showNotes = false,
    requireNotes = false,
    isLoading = false,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (notes?: string) => void;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant?: 'primary' | 'success' | 'warning' | 'destructive';
    showNotes?: boolean;
    requireNotes?: boolean;
    isLoading?: boolean;
}) {
    const [notes, setNotes] = useState('');

    if (!open) return null;

    const variantClasses = {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
    };

    const shouldShowNotes = showNotes || requireNotes;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>

                {shouldShowNotes && (
                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Catatan {requireNotes && <span className="text-red-500">*</span>}
                            {!requireNotes && <span className="text-gray-400 ml-1">(opsional)</span>}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            placeholder="Masukkan catatan..."
                        />
                    </div>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => onConfirm(shouldShowNotes ? notes : undefined)}
                        disabled={isLoading || (requireNotes && !notes.trim())}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${variantClasses[confirmVariant]}`}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PerubahanAnggaranDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const perubahanId = id ? parseInt(id, 10) : null;

    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        type: 'approve' | 'revise' | 'reject' | 'submit' | null;
    }>({ open: false, type: null });
    const [showDiscussion, setShowDiscussion] = useState(false);

    // Fetch data
    const { data: perubahan, isLoading, isError, error, refetch } = usePerubahanAnggaran(perubahanId);

    // Fetch expected stages separately for better reliability
    const { data: expectedStages } = usePerubahanAnggaranExpectedStages(perubahanId);

    // Mutations
    const submitMutation = useSubmitPerubahanAnggaran();
    const approveMutation = useApprovePerubahanAnggaran();
    const reviseMutation = useRevisePerubahanAnggaran();
    const rejectMutation = useRejectPerubahanAnggaran();
    const uploadAttachmentMutation = useUploadPerubahanAnggaranAttachment();
    const deleteAttachmentMutation = useDeletePerubahanAnggaranAttachment();

    // File state
    const [newFiles, setNewFiles] = useState<File[]>([]);

    // Check if user can approve
    const canApprove = (() => {
        if (!perubahan || !user) return false;

        const currentStage = perubahan.current_approval_stage;
        if (!currentStage) return false;

        const userStages = getApprovalStagesForRole(user.role);
        if (!userStages) return false;

        return userStages.some((s) => s === currentStage);
    })();

    // Check if user can submit
    const canSubmit = (() => {
        if (!perubahan || !user) return false;
        if (perubahan.user_id !== user.id) return false;

        const status = typeof perubahan.status === 'string' ? perubahan.status : perubahan.status;
        return (
            status === PerubahanAnggaranStatus.Draft ||
            status === PerubahanAnggaranStatus.RevisionRequired ||
            status === 'draft' ||
            status === 'revision-required'
        );
    })();

    // Handle actions
    const handleAction = async (type: 'approve' | 'revise' | 'reject' | 'submit', notes?: string) => {
        if (!perubahanId) return;

        try {
            switch (type) {
                case 'submit':
                    await submitMutation.mutateAsync(perubahanId);
                    toast.success('Perubahan anggaran berhasil diajukan');
                    break;
                case 'approve':
                    await approveMutation.mutateAsync({ id: perubahanId, notes });
                    toast.success('Perubahan anggaran berhasil disetujui');
                    navigate('/approvals');
                    return;
                case 'revise':
                    await reviseMutation.mutateAsync({ id: perubahanId, notes: notes! });
                    toast.success('Perubahan anggaran dikembalikan untuk revisi');
                    navigate('/approvals');
                    return;
                case 'reject':
                    await rejectMutation.mutateAsync({ id: perubahanId, notes: notes! });
                    toast.success('Perubahan anggaran ditolak');
                    navigate('/approvals');
                    return;
            }
            setActionDialog({ open: false, type: null });
            refetch();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memproses aksi');
        }
    };

    // Handle attachment upload
    const handleUploadFiles = async () => {
        if (!perubahanId || newFiles.length === 0) return;

        try {
            for (const file of newFiles) {
                await uploadAttachmentMutation.mutateAsync({
                    perubahanAnggaranId: perubahanId,
                    file,
                });
            }
            setNewFiles([]);
            refetch();
            toast.success('File berhasil diupload');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal mengupload file');
        }
    };

    // Handle attachment delete
    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!perubahanId) return;

        try {
            await deleteAttachmentMutation.mutateAsync({
                perubahanAnggaranId: perubahanId,
                attachmentId,
            });
            refetch();
            toast.success('File berhasil dihapus');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus file');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError || !perubahan) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-gray-600">Gagal memuat data</p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
                    </button>
                </div>
            </PageTransition>
        );
    }

    const status = typeof perubahan.status === 'string' ? perubahan.status : perubahan.status;

    // Check if editable (for attachments)
    const isEditable = status === 'draft' || status === 'revision-required' ||
        status === PerubahanAnggaranStatus.Draft || status === PerubahanAnggaranStatus.RevisionRequired;

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
                        title={`Perubahan Anggaran ${perubahan.nomor_perubahan}`}
                        description={perubahan.perihal}
                        backButton={
                            <button
                                onClick={() => navigate('/perubahan-anggaran')}
                                className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        }
                        actions={
                            <div className="flex items-center gap-2">
                                {/* Discussion Button - only for Wakil Ketua, Sekretaris, Ketum, Bendahara, Keuangan */}
                                {/* Direktur and Sekretariat use floating button instead */}
                                {canApprove && user?.role && SHOW_DISCUSSION_BUTTON_ROLES.includes(user.role as UserRole) && (
                                    <button
                                        onClick={() => setShowDiscussion(true)}
                                        className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Diskusi
                                    </button>
                                )}
                                {canSubmit && (
                                    <button
                                        onClick={() => setActionDialog({ open: true, type: 'submit' })}
                                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                                    >
                                        <Send className="h-4 w-4" />
                                        Ajukan
                                    </button>
                                )}
                                {canApprove && (
                                    <>
                                        <button
                                            onClick={() => setActionDialog({ open: true, type: 'approve' })}
                                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                                        >
                                            <Check className="h-4 w-4" />
                                            Setujui
                                        </button>
                                        <button
                                            onClick={() => setActionDialog({ open: true, type: 'revise' })}
                                            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Revisi
                                        </button>
                                        <button
                                            onClick={() => setActionDialog({ open: true, type: 'reject' })}
                                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                            Tolak
                                        </button>
                                    </>
                                )}
                            </div>
                        }
                    />
                </motion.div>

                {/* Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <motion.div variants={staggerItem} className="space-y-6 lg:col-span-2">
                        {/* Info Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                Informasi Umum
                            </h3>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Nomor Perubahan
                                    </dt>
                                    <dd className="mt-1 font-mono text-sm text-gray-900">
                                        {perubahan.nomor_perubahan}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPerubahanAnggaranStatusColor(status)}`}
                                        >
                                            {getPerubahanAnggaranStatusLabel(status)}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Tahap Saat Ini
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {perubahan.current_approval_stage
                                            ? getStageLabel(perubahan.current_approval_stage)
                                            : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Tanggal</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(perubahan.created_at)}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Alasan</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {perubahan.alasan}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Items Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                Item Transfer
                            </h3>
                            <div className="space-y-4">
                                {perubahan.items?.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-700">
                                                Item #{idx + 1}
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {formatRupiah(item.amount)}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                            <div className="flex-1 rounded bg-red-50 p-2">
                                                <p className="text-xs text-gray-500">Dari</p>
                                                <p className="font-medium text-gray-900">
                                                    {item.source_detail_mata_anggaran?.nama ||
                                                        `ID: ${item.source_detail_mata_anggaran_id}`}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                            <div className="flex-1 rounded bg-green-50 p-2">
                                                <p className="text-xs text-gray-500">Ke</p>
                                                <p className="font-medium text-gray-900">
                                                    {item.target_detail_mata_anggaran?.nama ||
                                                        `ID: ${item.target_detail_mata_anggaran_id}`}
                                                </p>
                                            </div>
                                        </div>
                                        {item.keterangan && (
                                            <p className="mt-2 text-sm text-gray-600 italic">
                                                "{item.keterangan}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="mt-4 flex items-center justify-end border-t border-gray-200 pt-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Transfer</p>
                                    <p className="text-xl font-bold text-primary-600">
                                        {formatRupiah(perubahan.total_amount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Logs Card (if processed) */}
                        {perubahan.logs && perubahan.logs.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">
                                    Riwayat Eksekusi
                                </h3>
                                <div className="space-y-3">
                                    {perubahan.logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="rounded-lg border border-green-200 bg-green-50 p-4"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Transfer {formatRupiah(log.amount)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {log.source_detail_mata_anggaran?.nama} →{' '}
                                                        {log.target_detail_mata_anggaran?.nama}
                                                    </p>
                                                </div>
                                                <div className="text-right text-xs text-gray-500">
                                                    {log.executed_at &&
                                                        formatDateTime(log.executed_at)}
                                                    {log.executor && (
                                                        <p>oleh {log.executor.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-500">
                                                        Saldo Asal:{' '}
                                                    </span>
                                                    <span className="text-gray-700">
                                                        {log.source_balance_change}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">
                                                        Saldo Tujuan:{' '}
                                                    </span>
                                                    <span className="text-gray-700">
                                                        {log.target_balance_change}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachments Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                Dokumen Pendukung
                            </h3>

                            {/* Existing attachments */}
                            {perubahan.attachments && perubahan.attachments.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {perubahan.attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-red-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {attachment.nama}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {((attachment.size || 0) / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/storage/${attachment.path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                                                    title="Lihat"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                                <a
                                                    href={`/storage/${attachment.path}`}
                                                    download={attachment.nama}
                                                    className="rounded p-1.5 text-green-600 hover:bg-green-50"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                {isEditable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(attachment.id)}
                                                        disabled={deleteAttachmentMutation.isPending}
                                                        className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                        title="Hapus"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mb-4">
                                    Tidak ada dokumen pendukung.
                                </p>
                            )}

                            {/* Upload new files - only when editable */}
                            {isEditable && (
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Tambah Dokumen Baru
                                    </p>
                                    <FileUpload
                                        onFilesSelected={setNewFiles}
                                        accept=".pdf"
                                        multiple
                                        maxSize={10}
                                    />
                                    {newFiles.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleUploadFiles}
                                            disabled={uploadAttachmentMutation.isPending}
                                            className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {uploadAttachmentMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Paperclip className="h-4 w-4" />
                                            )}
                                            Upload {newFiles.length} File
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Sidebar - Approval Timeline */}
                    <motion.div variants={staggerItem} className="lg:col-span-1">
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                Alur Persetujuan
                            </h3>
                            {expectedStages && expectedStages.length > 0 ? (
                                <ApprovalTimeline
                                    expectedStages={expectedStages}
                                    approvals={perubahan.approvals || []}
                                />
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Belum ada data alur persetujuan
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Revision Comment Thread */}
                {perubahan && (
                    <RevisionCommentThread docType="perubahan-anggaran" docId={perubahan.id} className="mt-6" />
                )}

                {/* Action Dialogs */}
                <ActionDialog
                    open={actionDialog.open && actionDialog.type === 'submit'}
                    onClose={() => setActionDialog({ open: false, type: null })}
                    onConfirm={() => handleAction('submit')}
                    title="Ajukan Perubahan Anggaran"
                    description="Apakah Anda yakin ingin mengajukan perubahan anggaran ini untuk diproses?"
                    confirmLabel="Ya, Ajukan"
                    confirmVariant="primary"
                    isLoading={submitMutation.isPending}
                />

                <ActionDialog
                    open={actionDialog.open && actionDialog.type === 'approve'}
                    onClose={() => setActionDialog({ open: false, type: null })}
                    onConfirm={(notes) => handleAction('approve', notes)}
                    title="Setujui Perubahan Anggaran"
                    description="Apakah Anda yakin ingin menyetujui perubahan anggaran ini?"
                    confirmLabel="Ya, Setujui"
                    confirmVariant="success"
                    showNotes
                    isLoading={approveMutation.isPending}
                />

                <ActionDialog
                    open={actionDialog.open && actionDialog.type === 'revise'}
                    onClose={() => setActionDialog({ open: false, type: null })}
                    onConfirm={(notes) => handleAction('revise', notes)}
                    title="Minta Revisi"
                    description="Berikan catatan untuk revisi perubahan anggaran ini."
                    confirmLabel="Kirim untuk Revisi"
                    confirmVariant="warning"
                    requireNotes
                    isLoading={reviseMutation.isPending}
                />

                <ActionDialog
                    open={actionDialog.open && actionDialog.type === 'reject'}
                    onClose={() => setActionDialog({ open: false, type: null })}
                    onConfirm={(notes) => handleAction('reject', notes)}
                    title="Tolak Perubahan Anggaran"
                    description="Berikan alasan penolakan perubahan anggaran ini."
                    confirmLabel="Tolak"
                    confirmVariant="destructive"
                    requireNotes
                    isLoading={rejectMutation.isPending}
                />

                {/* Discussion Modal */}
                {showDiscussion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setShowDiscussion(false)} />
                        <div className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl bg-white shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-purple-100 p-2">
                                        <MessageCircle className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Diskusi Persetujuan</h3>
                                        <p className="text-sm text-gray-500">{perubahan.nomor_perubahan}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDiscussion(false)}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {perubahan.approvals && perubahan.approvals.length > 0 ? (
                                    <div className="space-y-4">
                                        {perubahan.approvals.map((approval) => (
                                            <div
                                                key={approval.id}
                                                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-full p-2 ${
                                                            (approval.status as string) === 'approved' || approval.status === ApprovalStatus.Approved
                                                                ? 'bg-green-100'
                                                                : (approval.status as string) === 'revised' || approval.status === ApprovalStatus.Revised
                                                                    ? 'bg-amber-100'
                                                                    : (approval.status as string) === 'rejected' || approval.status === ApprovalStatus.Rejected
                                                                        ? 'bg-red-100'
                                                                        : 'bg-blue-100'
                                                        }`}>
                                                            {(approval.status as string) === 'approved' || approval.status === ApprovalStatus.Approved ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            ) : (approval.status as string) === 'revised' || approval.status === ApprovalStatus.Revised ? (
                                                                <RotateCcw className="h-4 w-4 text-amber-600" />
                                                            ) : (approval.status as string) === 'rejected' || approval.status === ApprovalStatus.Rejected ? (
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            ) : (
                                                                <Clock className="h-4 w-4 text-blue-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {approval.approver?.name || 'Menunggu'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {getStageLabel(approval.stage)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {approval.approved_at && (
                                                        <p className="text-sm text-gray-500">
                                                            {formatDateTime(approval.approved_at)}
                                                        </p>
                                                    )}
                                                </div>
                                                {approval.notes && (
                                                    <div className="mt-3 rounded-md bg-white p-3 border border-gray-200">
                                                        <p className="text-sm text-gray-700">{approval.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                                            <MessageCircle className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h4 className="text-base font-medium text-gray-700">Belum ada diskusi</h4>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Diskusi akan muncul setelah ada aktivitas persetujuan.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <p className="text-sm text-gray-500">
                                    Catatan dapat ditambahkan saat melakukan aksi persetujuan, revisi, atau penolakan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </PageTransition>
    );
}
