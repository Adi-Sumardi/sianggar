import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    Printer,
    CheckCircle2,
    RotateCcw,
    XCircle,
    Download,
    FileText,
    Eye,
    X,
    FileImage,
    File,
    Loader2,
    ClipboardCheck,
    Pencil,
    MessageSquare,
    Send,
    MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApprovalTimeline } from '@/components/common/ApprovalTimeline';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RevisionCommentThread } from '@/components/common/RevisionCommentThread';
import { VoucherModal } from '@/components/common/VoucherModal';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { ApprovalStage, ReferenceType, UserRole } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';
import { usePengajuan } from '@/hooks/useProposals';
import { usePengajuanApprovals, useApprovePengajuan, useRevisePengajuan, useRejectPengajuan, useValidateFinance, useEditAmount, usePrintVoucher, useMarkAsPaid, useDiscussion, useOpenDiscussion, useCloseDiscussion, useAddDiscussionMessage } from '@/hooks/useApprovals';


// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'items' | 'approval' | 'lampiran' | 'diskusi' | 'riwayat-edit';

// ---------------------------------------------------------------------------
// Attachment types & helpers
// ---------------------------------------------------------------------------

interface Attachment {
    id: number;
    nama: string;
    path: string;
    mime_type: string;
    size: number;
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType === 'application/pdf') return FileText;
    return File;
}

function isPreviewable(mimeType: string): boolean {
    return (
        mimeType.startsWith('image/') ||
        mimeType === 'application/pdf'
    );
}

// ---------------------------------------------------------------------------
// File Preview Modal
// ---------------------------------------------------------------------------

interface FilePreviewModalProps {
    file: Attachment | null;
    onClose: () => void;
}

function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
    if (!file) return null;

    const isPdf = file.mime_type === 'application/pdf';
    const isImage = file.mime_type.startsWith('image/');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">{file.nama}</h3>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={file.path}
                                download
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                title="Download"
                            >
                                <Download className="h-5 w-5" />
                            </a>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[calc(90vh-60px)] overflow-auto bg-slate-100 p-4">
                        {isPdf && (
                            <iframe
                                src={file.path}
                                className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
                                title={file.nama}
                            />
                        )}
                        {isImage && (
                            <div className="flex items-center justify-center">
                                <img
                                    src={file.path}
                                    alt={file.nama}
                                    className="max-h-[70vh] rounded-lg object-contain shadow-lg"
                                />
                            </div>
                        )}
                        {!isPdf && !isImage && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <File className="mb-4 h-16 w-16 text-slate-300" />
                                <p className="text-sm text-slate-500">
                                    Preview tidak tersedia untuk tipe file ini.
                                </p>
                                <a
                                    href={file.path}
                                    download
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Download File
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApprovalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabKey>('items');
    const [approveDialog, setApproveDialog] = useState(false);
    const [reviseDialog, setReviseDialog] = useState(false);
    const [rejectDialog, setRejectDialog] = useState(false);
    const [validateDialog, setValidateDialog] = useState(false);
    const [approveNotes, setApproveNotes] = useState('');
    const [reviseNotes, setReviseNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [validateNotes, setValidateNotes] = useState('');
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

    // Edit amount state
    const [editAmountDialog, setEditAmountDialog] = useState(false);
    const [newAmount, setNewAmount] = useState('');
    const [editAmountReason, setEditAmountReason] = useState('');

    // Print voucher state
    const [printVoucherDialog, setPrintVoucherDialog] = useState(false);

    // Mark as paid state
    const [markAsPaidDialog, setMarkAsPaidDialog] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Discussion state (for Ketum)
    const [discussionDialog, setDiscussionDialog] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    // Finance validation checklist state
    const [validDocument, setValidDocument] = useState(false);
    const [validCalculation, setValidCalculation] = useState(false);
    const [validBudgetCode, setValidBudgetCode] = useState(false);
    const [reasonableCost, setReasonableCost] = useState(false);
    const [reasonableVolume, setReasonableVolume] = useState(false);
    const [reasonableExecutor, setReasonableExecutor] = useState(false);
    const [referenceType, setReferenceType] = useState<string>('');
    const [needLpj, setNeedLpj] = useState(false);

    const pengajuanId = id ? parseInt(id, 10) : null;

    // Fetch pengajuan data from API
    const { data: pengajuan, isLoading, isError, error } = usePengajuan(pengajuanId);

    // Fetch approval history from API
    const { data: approvals = [] } = usePengajuanApprovals(pengajuanId);

    // Mutation hooks for actions
    const approveMutation = useApprovePengajuan();
    const reviseMutation = useRevisePengajuan();
    const rejectMutation = useRejectPengajuan();
    const validateMutation = useValidateFinance();
    const editAmountMutation = useEditAmount();
    const printVoucherMutation = usePrintVoucher();
    const markAsPaidMutation = useMarkAsPaid();

    // Check user role for Ketum (needed early for discussion management)
    const isUserKetum = user?.role === UserRole.Ketum;

    // Leadership roles that can participate in discussions (defined early for polling control)
    const isLeadershipRole = user?.role && (
        user.role === UserRole.Ketum ||
        user.role === UserRole.Ketua1 ||      // Wakil Ketua
        user.role === UserRole.Sekretaris ||
        user.role === UserRole.Direktur ||
        user.role === UserRole.KabagSdmUmum ||
        user.role === UserRole.Sekretariat || // Kabag Sekretariat
        user.role === UserRole.Keuangan ||
        user.role === UserRole.Bendahara
    );

    // Discussion hooks (for Ketum & other leadership roles)
    // Poll for discussions to show floating button to all leadership
    const { data: discussions = [], refetch: refetchDiscussion } = useDiscussion(
        pengajuanId,
        {
            // Only poll for leadership roles
            // Poll every 5 seconds to check for active discussions (for floating button)
            // Poll faster (3s) when dialog is open for real-time chat
            refetchInterval: isLeadershipRole ? (discussionDialog ? 3000 : 5000) : false
        }
    );
    const openDiscussionMutation = useOpenDiscussion();
    const closeDiscussionMutation = useCloseDiscussion();
    const addMessageMutation = useAddDiscussionMessage();

    // Get active discussion and flatten messages
    const activeDiscussion = discussions.find(d => d.status === 'open');
    const hasActiveDiscussion = !!activeDiscussion;
    const discussionMessages = activeDiscussion?.messages || [];

    // Get all messages from all discussions (including closed) for history
    const allDiscussionMessages = discussions.flatMap(d => d.messages || []);

    const canApprove = pengajuan && ['submitted', 'approved-level-1', 'approved-level-2', 'final-approved', 'done'].includes(pengajuan.status_proses);

    // Check if user is Kasir at Kasir stage
    const isKasirStage = pengajuan?.current_approval_stage === ApprovalStage.Kasir;
    const isUserKasir = user?.role === UserRole.Kasir;
    const showKasirActions = isKasirStage && isUserKasir;

    // Check if user is Payment at Payment stage
    const isPaymentStage = pengajuan?.current_approval_stage === ApprovalStage.Payment;
    const isUserPayment = user?.role === UserRole.Payment;
    const showPaymentActions = isPaymentStage && isUserPayment;

    // Check if current stage is Staff Keuangan and user is Staff Keuangan
    const isStaffKeuanganStage = pengajuan?.current_approval_stage === ApprovalStage.StaffKeuangan;
    const isUserStaffKeuangan = user?.role === UserRole.StaffKeuangan;
    const showValidationForm = isStaffKeuanganStage && isUserStaffKeuangan;

    // Check if user can edit amount (Keuangan or Bendahara at their respective stage)
    const isKeuanganStage = pengajuan?.current_approval_stage === ApprovalStage.Keuangan;
    const isBendaharaStage = pengajuan?.current_approval_stage === ApprovalStage.Bendahara;
    const isUserKeuangan = user?.role === UserRole.Keuangan;
    const isUserBendahara = user?.role === UserRole.Bendahara;
    const canEditAmount = (isKeuanganStage && isUserKeuangan) || (isBendaharaStage && isUserBendahara);

    // Check if user is Ketum at Ketum stage (can open/close discussion)
    const isKetumStage = pengajuan?.current_approval_stage === ApprovalStage.Ketum;
    const showKetumActions = isKetumStage && isUserKetum;

    // Roles that can open discussions: Ketum, Sekretaris, Wakil Ketua (Ketua1), Bendahara
    const isUserSekretaris = user?.role === UserRole.Sekretaris;
    const isUserWakilKetua = user?.role === UserRole.Ketua1;
    const canOpenDiscussion = isUserKetum || isUserSekretaris || isUserWakilKetua || isUserBendahara;

    // Only the opener can close the discussion
    const canCloseDiscussion = !!activeDiscussion && user?.id === activeDiscussion.opener?.id;

    // Show "Buka Diskusi" button when user can open and no active discussion
    const showOpenDiscussionButton = canOpenDiscussion && !hasActiveDiscussion;
    // Show floating discussion button for all leadership when there's an active discussion
    const showFloatingDiscussionButton = isLeadershipRole && hasActiveDiscussion;

    const hasAmountEditLogs = pengajuan?.amount_edit_logs && pengajuan.amount_edit_logs.length > 0;

    const hasDiscussions = discussions && discussions.length > 0;

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'items', label: 'Detail Item' },
        { key: 'approval', label: 'Riwayat Approval' },
        { key: 'lampiran', label: 'Lampiran' },
        ...(hasDiscussions ? [{ key: 'diskusi' as TabKey, label: 'Riwayat Diskusi' }] : []),
        ...(hasAmountEditLogs ? [{ key: 'riwayat-edit' as TabKey, label: 'Riwayat Edit Nominal' }] : []),
    ];

    const handleApprove = async () => {
        if (!pengajuanId) return;

        try {
            await approveMutation.mutateAsync({
                pengajuanId,
                dto: approveNotes.trim() ? { notes: approveNotes.trim() } : undefined,
            });
            toast.success('Pengajuan berhasil disetujui');
            setApproveDialog(false);
            setApproveNotes('');
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyetujui pengajuan');
        }
    };

    const handleRevise = async () => {
        if (!pengajuanId) return;

        if (!reviseNotes.trim()) {
            toast.error('Catatan revisi wajib diisi');
            return;
        }

        try {
            await reviseMutation.mutateAsync({
                pengajuanId,
                dto: { notes: reviseNotes.trim() },
            });
            toast.success('Pengajuan dikembalikan untuk revisi');
            setReviseDialog(false);
            setReviseNotes('');
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengembalikan pengajuan');
        }
    };

    const handleReject = async () => {
        if (!pengajuanId) return;

        if (!rejectNotes.trim()) {
            toast.error('Alasan penolakan wajib diisi');
            return;
        }

        try {
            await rejectMutation.mutateAsync({
                pengajuanId,
                dto: { notes: rejectNotes.trim() },
            });
            toast.success('Pengajuan ditolak');
            setRejectDialog(false);
            setRejectNotes('');
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menolak pengajuan');
        }
    };

    const handleValidate = async () => {
        if (!pengajuanId) return;

        // Validate that reference type is selected
        if (!referenceType) {
            toast.error('Pilih rujukan/bidang terlebih dahulu');
            return;
        }

        // Check if at least one checklist item is checked
        const anyChecked = validDocument || validCalculation || validBudgetCode ||
                          reasonableCost || reasonableVolume || reasonableExecutor;
        if (!anyChecked) {
            toast.error('Minimal satu item kelengkapan harus dicentang');
            return;
        }

        try {
            await validateMutation.mutateAsync({
                pengajuanId,
                dto: {
                    valid_document: validDocument,
                    valid_calculation: validCalculation,
                    valid_budget_code: validBudgetCode,
                    reasonable_cost: reasonableCost,
                    reasonable_volume: reasonableVolume,
                    reasonable_executor: reasonableExecutor,
                    reference_type: referenceType,
                    need_lpj: needLpj,
                    notes: validateNotes.trim() || undefined,
                },
            });
            toast.success('Validasi dan approval berhasil');
            setValidateDialog(false);
            // Reset form
            setValidDocument(false);
            setValidCalculation(false);
            setValidBudgetCode(false);
            setReasonableCost(false);
            setReasonableVolume(false);
            setReasonableExecutor(false);
            setReferenceType('');
            setNeedLpj(false);
            setValidateNotes('');
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal melakukan validasi');
        }
    };

    const handleEditAmount = async () => {
        if (!pengajuanId) return;

        const amount = parseFloat(newAmount.replace(/[^0-9.]/g, ''));
        if (isNaN(amount) || amount <= 0) {
            toast.error('Nominal tidak valid');
            return;
        }

        try {
            await editAmountMutation.mutateAsync({
                pengajuanId,
                dto: {
                    new_amount: amount,
                    reason: editAmountReason.trim() || undefined,
                },
            });
            toast.success('Nominal berhasil diubah');
            setEditAmountDialog(false);
            setNewAmount('');
            setEditAmountReason('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengubah nominal');
        }
    };

    const handlePrintVoucher = async () => {
        if (!pengajuanId) return;

        try {
            await printVoucherMutation.mutateAsync(pengajuanId);
            toast.success('Voucher berhasil dicetak dan diteruskan ke Payment');
            setPrintVoucherDialog(false);
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mencetak voucher');
        }
    };

    const handleMarkAsPaid = async () => {
        if (!pengajuanId) return;

        if (!recipientName.trim()) {
            toast.error('Nama penerima wajib diisi');
            return;
        }

        try {
            await markAsPaidMutation.mutateAsync({
                pengajuanId,
                dto: {
                    recipient_name: recipientName.trim(),
                    payment_method: paymentMethod.trim() || undefined,
                    notes: paymentNotes.trim() || undefined,
                },
            });
            toast.success('Pembayaran berhasil dicatat');
            setMarkAsPaidDialog(false);
            setRecipientName('');
            setPaymentMethod('');
            setPaymentNotes('');
            navigate('/approvals');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran');
        }
    };

    const handleOpenDiscussion = async () => {
        if (!pengajuanId) return;

        try {
            await openDiscussionMutation.mutateAsync(pengajuanId);
            toast.success('Diskusi dibuka');
            refetchDiscussion();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal membuka diskusi');
        }
    };

    const handleCloseDiscussion = async () => {
        if (!pengajuanId) return;

        try {
            await closeDiscussionMutation.mutateAsync(pengajuanId);
            toast.success('Diskusi ditutup');
            refetchDiscussion();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menutup diskusi');
        }
    };

    const handleSendMessage = async () => {
        if (!pengajuanId || !newMessage.trim()) return;

        try {
            await addMessageMutation.mutateAsync({
                pengajuanId,
                dto: { message: newMessage.trim() },
            });
            setNewMessage('');
            refetchDiscussion();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengirim pesan');
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
    if (isError || !pengajuan) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data pengajuan'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/approvals')}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Antrian
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
                        title="Review Pengajuan"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/approvals')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Antrian
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
                                <h2 className="text-xl font-bold text-slate-900">{pengajuan.perihal}</h2>
                                <StatusBadge status={pengajuan.status_proses} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                                <span>No: <span className="font-medium text-blue-600">{pengajuan.nomor_pengajuan}</span></span>
                                <span>Unit: <span className="font-medium text-slate-700">{pengajuan.unit?.nama || '-'}</span></span>
                                <span>Tahun: <span className="font-medium text-slate-700">{pengajuan.tahun_anggaran}</span></span>
                                <span>Pengaju: <span className="font-medium text-slate-700">{pengajuan.user?.name || '-'}</span></span>
                                <span>Tanggal: <span className="font-medium text-slate-700">{formatDate(pengajuan.created_at)}</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            {pengajuan.approved_amount ? (
                                <>
                                    <p className="text-xs font-medium text-slate-500">Nominal Disetujui</p>
                                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(pengajuan.approved_amount)}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Pengajuan Awal: {formatRupiah(pengajuan.jumlah_pengajuan_total)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-slate-500">Total Pengajuan</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatRupiah(pengajuan.jumlah_pengajuan_total)}</p>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

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
                                        layoutId="approval-detail-tab-indicator"
                                        className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab content */}
                <motion.div variants={staggerItem}>
                    {activeTab === 'items' && (
                        <div className="rounded-lg border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mata Anggaran</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Sub</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Detail / Uraian</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Pagu</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Terpakai</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Saldo</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Vol</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Satuan</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Harga Satuan</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(pengajuan.detail_pengajuans || []).map((detail, index) => {
                                            const pagu = detail.detail_mata_anggaran?.anggaran_awal ?? 0;
                                            const terpakai = detail.detail_mata_anggaran?.saldo_dipakai ?? 0;
                                            const saldo = detail.detail_mata_anggaran?.saldo_tersedia ?? (pagu - terpakai);
                                            const isSaldoKurang = detail.jumlah > saldo;

                                            return (
                                                <tr key={detail.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                    <td className="px-4 py-3 text-slate-700">{detail.mata_anggaran?.nama || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-700">{detail.sub_mata_anggaran?.nama || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-700">{detail.uraian || detail.detail_mata_anggaran?.nama || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(pagu)}</td>
                                                    <td className="px-4 py-3 text-right text-amber-600">{formatRupiah(terpakai)}</td>
                                                    <td className={cn(
                                                        "px-4 py-3 text-right font-medium",
                                                        isSaldoKurang ? "text-red-600" : "text-emerald-600"
                                                    )}>
                                                        {formatRupiah(saldo)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{detail.volume || 1}</td>
                                                    <td className="px-4 py-3 text-slate-700">{detail.satuan || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{formatRupiah(detail.harga_satuan || 0)}</td>
                                                    <td className={cn(
                                                        "px-4 py-3 text-right font-medium",
                                                        isSaldoKurang ? "text-red-600" : "text-slate-900"
                                                    )}>
                                                        {formatRupiah(detail.jumlah)}
                                                        {isSaldoKurang && (
                                                            <span className="ml-1 text-xs text-red-500">!</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                                            <td colSpan={10} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                                Total Pengajuan
                                            </td>
                                            <td className="px-4 py-3 text-right text-base font-bold text-blue-600">
                                                {formatRupiah(pengajuan.jumlah_pengajuan_total)}
                                            </td>
                                        </tr>
                                        {pengajuan.approved_amount && (
                                            <tr className="bg-emerald-50">
                                                <td colSpan={10} className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                                                    Nominal Disetujui
                                                </td>
                                                <td className="px-4 py-3 text-right text-base font-bold text-emerald-600">
                                                    {formatRupiah(pengajuan.approved_amount)}
                                                </td>
                                            </tr>
                                        )}
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'approval' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Riwayat Persetujuan
                            </h3>
                            <ApprovalTimeline
                                approvals={approvals}
                                currentStage={pengajuan.current_approval_stage as ApprovalStage}
                            />
                        </div>
                    )}

                    {activeTab === 'lampiran' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Dokumen Lampiran
                            </h3>
                            {(!pengajuan.attachments || pengajuan.attachments.length === 0) ? (
                                <p className="text-sm text-slate-500">Tidak ada lampiran.</p>
                            ) : (
                                <div className="space-y-2">
                                    {pengajuan.attachments.map((file) => {
                                        const IconComponent = getFileIcon(file.mime_type);
                                        const canPreview = isPreviewable(file.mime_type);
                                        const attachment: Attachment = {
                                            id: file.id,
                                            nama: file.nama,
                                            path: file.path,
                                            mime_type: file.mime_type,
                                            size: file.size,
                                        };

                                        return (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                                            >
                                                <IconComponent className="h-5 w-5 shrink-0 text-blue-500" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-700">
                                                        {file.nama}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                        {canPreview && (
                                                            <span className="ml-2 text-green-600">• Dapat dipreview</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewFile(attachment)}
                                                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-blue-600"
                                                        title="Lihat"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <a
                                                        href={file.path}
                                                        download
                                                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-blue-600"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'diskusi' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Riwayat Diskusi Internal Pimpinan
                            </h3>
                            {(!discussions || discussions.length === 0) ? (
                                <p className="text-sm text-slate-500">Tidak ada riwayat diskusi.</p>
                            ) : (
                                <div className="space-y-6">
                                    {discussions.map((discussion: any, dIndex: number) => (
                                        <div
                                            key={discussion.id || dIndex}
                                            className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                                        >
                                            {/* Discussion Header */}
                                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                                            discussion.status === 'open'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-slate-200 text-slate-600'
                                                        )}>
                                                            {discussion.status === 'open' ? (
                                                                <>
                                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                                                    Aktif
                                                                </>
                                                            ) : 'Selesai'}
                                                        </span>
                                                        <span className="text-sm text-slate-600">
                                                            Diskusi #{discussions.length - dIndex}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {discussion.messages?.length || 0} pesan
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    <p>Dibuka oleh {discussion.opener?.name || 'Unknown'} pada {discussion.opened_at ? new Date(discussion.opened_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                                    {discussion.status === 'closed' && discussion.closer && (
                                                        <p className="mt-0.5">Ditutup oleh {discussion.closer.name} pada {discussion.closed_at ? new Date(discussion.closed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Discussion Messages */}
                                            <div className="p-4">
                                                {(!discussion.messages || discussion.messages.length === 0) ? (
                                                    <p className="text-sm text-slate-500 text-center py-4">Tidak ada pesan dalam diskusi ini.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {discussion.messages.map((msg: any) => (
                                                            <div
                                                                key={msg.id}
                                                                className="rounded-lg bg-white border border-slate-200 p-3"
                                                            >
                                                                <div className="flex items-start justify-between mb-1">
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        {msg.user?.name || 'Unknown'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {msg.created_at ? new Date(msg.created_at).toLocaleString('id-ID', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        }) : ''}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                                                    {msg.message}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'riwayat-edit' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Riwayat Perubahan Nominal
                            </h3>
                            {(!pengajuan.amount_edit_logs || pengajuan.amount_edit_logs.length === 0) ? (
                                <p className="text-sm text-slate-500">Tidak ada riwayat perubahan nominal.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pengajuan.amount_edit_logs.map((log: any, index: number) => (
                                        <div
                                            key={log.id || index}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        Diubah oleh: {log.editor?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {log.created_at ? formatDate(log.created_at) : '-'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Nominal Lama</p>
                                                    <p className="text-sm font-medium text-slate-700 line-through">
                                                        {formatRupiah(log.original_amount)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-2">Nominal Baru</p>
                                                    <p className="text-sm font-semibold text-emerald-600">
                                                        {formatRupiah(log.new_amount)}
                                                    </p>
                                                </div>
                                            </div>
                                            {log.reason && (
                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                    <p className="text-xs text-slate-500">Alasan:</p>
                                                    <p className="text-sm text-slate-700">{log.reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Action buttons - Always visible for approvers */}
                <motion.div
                    variants={staggerItem}
                    className="mt-6 flex flex-wrap items-center gap-2 print:hidden"
                >
                    {/* Payment: Only show Mark as Paid button */}
                    {showPaymentActions ? (
                        <button
                            type="button"
                            onClick={() => setMarkAsPaidDialog(true)}
                            disabled={markAsPaidMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark as Paid
                        </button>
                    ) : showKasirActions ? (
                        /* Kasir: Only show Cetak Voucher button */
                        <button
                            type="button"
                            onClick={() => setPrintVoucherDialog(true)}
                            disabled={printVoucherMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak Voucher
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <Printer className="h-4 w-4" />
                                Cetak
                            </button>

                            {/* Edit Amount button for Keuangan and Bendahara */}
                            {canEditAmount && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewAmount(pengajuan.jumlah_pengajuan_total?.toString() || '');
                                        setEditAmountDialog(true);
                                    }}
                                    disabled={editAmountMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit Nominal
                                </button>
                            )}

                            {canApprove && (
                                <>
                                    {/* Leadership: Show Diskusi button to open new discussion or join active discussion */}
                                    {canOpenDiscussion && (
                                        <button
                                            type="button"
                                            onClick={() => setDiscussionDialog(true)}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors",
                                                hasActiveDiscussion
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : "bg-purple-600 hover:bg-purple-700"
                                            )}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            {hasActiveDiscussion ? 'Diskusi Aktif' : 'Buka Diskusi'}
                                            {discussionMessages.length > 0 && (
                                                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                                                    {discussionMessages.length}
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {showValidationForm ? (
                                        /* Staff Keuangan: Show Validasi button */
                                        <button
                                            type="button"
                                            onClick={() => setValidateDialog(true)}
                                            disabled={validateMutation.isPending}
                                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <ClipboardCheck className="h-4 w-4" />
                                            Validasi & Setujui
                                        </button>
                                    ) : (
                                        /* Other stages: Show regular Setujui button */
                                        <button
                                            type="button"
                                            onClick={() => setApproveDialog(true)}
                                            disabled={approveMutation.isPending}
                                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Setujui
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setReviseDialog(true)}
                                        disabled={reviseMutation.isPending}
                                        className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-50"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Revisi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRejectDialog(true)}
                                        disabled={rejectMutation.isPending}
                                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Tolak
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </motion.div>
            </motion.div>

            {/* Revision Comment Thread */}
            {pengajuan && (
                <RevisionCommentThread docType="pengajuan" docId={pengajuan.id} className="mt-6" />
            )}

            {/* Approve dialog */}
            <ConfirmDialog
                open={approveDialog}
                onOpenChange={setApproveDialog}
                title="Setujui Pengajuan"
                description={`Anda akan menyetujui pengajuan "${pengajuan.perihal}" senilai ${formatRupiah(pengajuan.approved_amount || pengajuan.jumlah_pengajuan_total)}.`}
                confirmLabel={approveMutation.isPending ? 'Menyetujui...' : 'Setujui'}
                variant="approve"
                onConfirm={handleApprove}
            >
                <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Catatan (opsional)"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                    disabled={approveMutation.isPending}
                />
            </ConfirmDialog>

            {/* Revise dialog */}
            <ConfirmDialog
                open={reviseDialog}
                onOpenChange={setReviseDialog}
                title="Kembalikan untuk Revisi"
                description="Berikan catatan revisi agar pengaju dapat memperbaiki pengajuan."
                confirmLabel={reviseMutation.isPending ? 'Mengembalikan...' : 'Kembalikan'}
                variant="revise"
                onConfirm={handleRevise}
            >
                <textarea
                    value={reviseNotes}
                    onChange={(e) => setReviseNotes(e.target.value)}
                    placeholder="Catatan revisi (wajib diisi)"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                    required
                    disabled={reviseMutation.isPending}
                />
            </ConfirmDialog>

            {/* Reject dialog */}
            <ConfirmDialog
                open={rejectDialog}
                onOpenChange={setRejectDialog}
                title="Tolak Pengajuan"
                description="Pengajuan yang ditolak tidak dapat diproses lagi. Pastikan alasan penolakan jelas."
                confirmLabel={rejectMutation.isPending ? 'Menolak...' : 'Tolak'}
                variant="delete"
                onConfirm={handleReject}
            >
                <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Alasan penolakan (wajib diisi)"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                    required
                    disabled={rejectMutation.isPending}
                />
            </ConfirmDialog>

            {/* Edit Amount Dialog */}
            <AnimatePresence>
                {editAmountDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setEditAmountDialog(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Edit Nominal Pengajuan
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ubah nominal pengajuan jika diperlukan
                                </p>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                {/* Current Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nominal Saat Ini
                                    </label>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {formatRupiah(pengajuan.jumlah_pengajuan_total)}
                                    </p>
                                </div>

                                {/* New Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nominal Baru <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newAmount}
                                        onChange={(e) => {
                                            // Allow only numbers and formatting
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setNewAmount(value);
                                        }}
                                        placeholder="Masukkan nominal baru"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    {newAmount && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            = {formatRupiah(parseFloat(newAmount) || 0)}
                                        </p>
                                    )}
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Alasan Perubahan (opsional)
                                    </label>
                                    <textarea
                                        value={editAmountReason}
                                        onChange={(e) => setEditAmountReason(e.target.value)}
                                        placeholder="Alasan mengubah nominal..."
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditAmountDialog(false);
                                        setNewAmount('');
                                        setEditAmountReason('');
                                    }}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEditAmount}
                                    disabled={editAmountMutation.isPending || !newAmount}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editAmountMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Finance Validation dialog for Staff Keuangan */}
            <AnimatePresence>
                {validateDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setValidateDialog(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Validasi Kelengkapan Pengajuan
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ceklist kelengkapan dokumen dan tentukan rujukan sebelum menyetujui
                                </p>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                                {/* Checklist Section */}
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">List Kelengkapan Pengajuan:</p>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={validDocument}
                                            onChange={(e) => setValidDocument(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Dokumen lengkap</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={validCalculation}
                                            onChange={(e) => setValidCalculation(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Perhitungan benar</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={validBudgetCode}
                                            onChange={(e) => setValidBudgetCode(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Kode anggaran sesuai</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={reasonableCost}
                                            onChange={(e) => setReasonableCost(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Biaya wajar</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={reasonableVolume}
                                            onChange={(e) => setReasonableVolume(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Volume wajar</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={reasonableExecutor}
                                            onChange={(e) => setReasonableExecutor(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Pelaksana wajar</span>
                                    </label>
                                </div>

                                {/* Reference Type Dropdown */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Rujukan / Bidang <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={referenceType}
                                        onChange={(e) => setReferenceType(e.target.value)}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Pilih rujukan...</option>
                                        <option value={ReferenceType.Education}>Bidang Pendidikan (Direktur)</option>
                                        <option value={ReferenceType.HrGeneral}>Bidang SDM & Umum (Kabag SDM Umum)</option>
                                        <option value={ReferenceType.Secretariat}>Bidang Sekretariat (Kabag Sekretariat)</option>
                                    </select>
                                </div>

                                {/* Need LPJ Toggle */}
                                <div className="mt-4">
                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={needLpj}
                                            onChange={(e) => setNeedLpj(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Wajib LPJ</span>
                                    </label>
                                </div>

                                {/* Notes */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Catatan (opsional)
                                    </label>
                                    <textarea
                                        value={validateNotes}
                                        onChange={(e) => setValidateNotes(e.target.value)}
                                        placeholder="Catatan validasi..."
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setValidateDialog(false)}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleValidate}
                                    disabled={validateMutation.isPending || !referenceType}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {validateMutation.isPending ? 'Memproses...' : 'Validasi & Setujui'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voucher Preview and Print Modal */}
            <VoucherModal
                pengajuan={pengajuan}
                open={printVoucherDialog}
                onClose={() => setPrintVoucherDialog(false)}
                onPrint={handlePrintVoucher}
                isPrinting={printVoucherMutation.isPending}
            />

            {/* Mark as Paid Dialog for Payment role */}
            <AnimatePresence>
                {markAsPaidDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setMarkAsPaidDialog(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Mark as Paid
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Catat detail pembayaran untuk pengajuan ini
                                </p>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                {/* Payment Info */}
                                <div className="rounded-lg bg-slate-50 p-4">
                                    <div className="text-sm text-slate-600">
                                        <p><span className="font-medium">No Voucher:</span> {pengajuan.voucher_number || '-'}</p>
                                        <p><span className="font-medium">Perihal:</span> {pengajuan.perihal}</p>
                                        <p><span className="font-medium">Total:</span> {formatRupiah(pengajuan.approved_amount || pengajuan.jumlah_pengajuan_total)}</p>
                                    </div>
                                </div>

                                {/* Recipient Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nama Penerima <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="Masukkan nama penerima transfer"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Metode Pembayaran (opsional)
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Pilih metode...</option>
                                        <option value="transfer">Transfer Bank</option>
                                        <option value="cash">Cash</option>
                                        <option value="cek">Cek</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Catatan (opsional)
                                    </label>
                                    <textarea
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        placeholder="Catatan pembayaran..."
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        rows={2}
                                    />
                                </div>

                                {/* Timestamp Info */}
                                <div className="rounded-lg bg-blue-50 p-3">
                                    <p className="text-xs text-blue-700">
                                        Waktu pembayaran akan dicatat otomatis saat Anda menekan tombol "Konfirmasi Pembayaran"
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMarkAsPaidDialog(false);
                                        setRecipientName('');
                                        setPaymentMethod('');
                                        setPaymentNotes('');
                                    }}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleMarkAsPaid}
                                    disabled={markAsPaidMutation.isPending || !recipientName.trim()}
                                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {markAsPaidMutation.isPending ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Discussion Dialog for Ketum & Leadership */}
            <AnimatePresence>
                {discussionDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setDiscussionDialog(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="flex h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'rounded-lg p-2',
                                        hasActiveDiscussion ? 'bg-green-100' : 'bg-purple-100'
                                    )}>
                                        <MessageCircle className={cn(
                                            'h-5 w-5',
                                            hasActiveDiscussion ? 'text-green-600' : 'text-purple-600'
                                        )} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                Diskusi Internal Pimpinan
                                            </h3>
                                            {hasActiveDiscussion && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {pengajuan.perihal}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDiscussionDialog(false)}
                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Participants Info */}
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
                                <p className="text-xs text-slate-500">
                                    <span className="font-medium">Peserta diskusi:</span> Ketua Umum, Wakil Ketua, Sekretaris, Direktur Pendidikan, Kabag SDM Umum, Kabag Sekretariat, Keuangan, Bendahara
                                </p>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {!hasActiveDiscussion && discussionMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="rounded-full bg-slate-100 p-4 mb-4">
                                            <MessageSquare className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-base font-medium text-slate-700">
                                            Belum ada diskusi
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm">
                                            {canOpenDiscussion
                                                ? 'Buka diskusi untuk membahas pengajuan ini bersama pimpinan terkait sebelum mengambil keputusan.'
                                                : 'Belum ada diskusi aktif untuk pengajuan ini. Ketum, Sekretaris, Wakil Ketua, atau Bendahara dapat membuka diskusi jika diperlukan.'
                                            }
                                        </p>
                                        {canOpenDiscussion && (
                                            <button
                                                type="button"
                                                onClick={handleOpenDiscussion}
                                                disabled={openDiscussionMutation.isPending}
                                                className="mt-4 inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                {openDiscussionMutation.isPending ? 'Membuka...' : 'Buka Diskusi'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {discussionMessages.map((msg: any) => {
                                            const isCurrentUser = msg.user?.id === user?.id;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        'flex',
                                                        isCurrentUser ? 'justify-end' : 'justify-start'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'max-w-[75%] rounded-2xl px-4 py-3',
                                                            isCurrentUser
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-slate-100 text-slate-900'
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            'mb-1 text-xs font-medium',
                                                            isCurrentUser ? 'text-purple-200' : 'text-slate-500'
                                                        )}>
                                                            {msg.user?.name || 'Unknown'}
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {msg.message}
                                                        </p>
                                                        <div className={cn(
                                                            'mt-1 text-xs',
                                                            isCurrentUser ? 'text-purple-200' : 'text-slate-400'
                                                        )}>
                                                            {msg.created_at ? new Date(msg.created_at).toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Input & Actions */}
                            {hasActiveDiscussion ? (
                                <div className="border-t border-slate-200">
                                    {/* Message Input */}
                                    <div className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Ketik pesan..."
                                                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendMessage}
                                                disabled={addMessageMutation.isPending || !newMessage.trim()}
                                                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Tekan Enter untuk mengirim • Diskusi hanya terlihat oleh pimpinan
                                        </p>
                                    </div>

                                    {/* End Discussion Button (only for Ketum) */}
                                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-500">
                                                Diskusi dibuka oleh {activeDiscussion.opener?.name || 'Unknown'} pada{' '}
                                                {activeDiscussion.opened_at
                                                    ? new Date(activeDiscussion.opened_at).toLocaleString('id-ID', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                      })
                                                    : '-'
                                                }
                                            </p>
                                            {canCloseDiscussion && (
                                                <button
                                                    type="button"
                                                    onClick={handleCloseDiscussion}
                                                    disabled={closeDiscussionMutation.isPending}
                                                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    {closeDiscussionMutation.isPending ? 'Mengakhiri...' : 'Akhiri Diskusi'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : discussionMessages.length > 0 ? (
                                /* Discussion is closed but has messages */
                                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                            Diskusi telah ditutup
                                        </div>
                                        {canOpenDiscussion && (
                                            <button
                                                type="button"
                                                onClick={handleOpenDiscussion}
                                                disabled={openDiscussionMutation.isPending}
                                                className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                {openDiscussionMutation.isPending ? 'Membuka...' : 'Buka Diskusi Baru'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}

            {/* Floating Discussion Button - visible to all leadership when discussion is active */}
            <AnimatePresence>
                {showFloatingDiscussionButton && !discussionDialog && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        type="button"
                        onClick={() => setDiscussionDialog(true)}
                        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all hover:bg-green-700 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500/30"
                    >
                        {/* Pulse ring animation */}
                        <span className="absolute -inset-1 animate-ping rounded-full bg-green-400 opacity-30" />
                        <span className="absolute -inset-0.5 rounded-full bg-green-500 opacity-20" />

                        <MessageCircle className="relative h-6 w-6" />

                        {/* Message count badge */}
                        {discussionMessages.length > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-sm">
                                {discussionMessages.length > 99 ? '99+' : discussionMessages.length}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Floating button tooltip - shows on hover (optional enhancement) */}
            <AnimatePresence>
                {showFloatingDiscussionButton && !discussionDialog && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: 0.5 }}
                        className="fixed bottom-8 right-24 z-40 hidden sm:block"
                    >
                        <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                                Diskusi Aktif
                            </div>
                            <div className="mt-0.5 text-xs text-slate-300">
                                Klik untuk bergabung
                            </div>
                        </div>
                        {/* Arrow pointing to button */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                            <div className="border-8 border-transparent border-l-slate-900" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}
