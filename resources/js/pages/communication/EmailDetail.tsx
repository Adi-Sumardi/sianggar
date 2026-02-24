import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Archive,
    Reply,
    Download,
    FileText,
    Mail,
    Calendar,
    User,
    Users,
    Send,
    Loader2,
    Eye,
    Paperclip,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatDateTime } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useEmail, useArchiveEmail, useCreateEmailReply } from '@/hooks/useEmails';
import { FilePreviewModal } from '@/components/common/FilePreviewModal';
import type { Email, Attachment } from '@/types/models';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function getRecipientsDisplay(email: Email): string {
    if (email.recipients && email.recipients.length > 0) {
        return email.recipients.map((r) => r.display_name).join(', ');
    }
    return email.ditujukan || '-';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [replyText, setReplyText] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
    const [replyFiles, setReplyFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emailId = id ? parseInt(id, 10) : null;
    const { data: email, isLoading, isError } = useEmail(emailId);
    const archiveEmail = useArchiveEmail();
    const createReply = useCreateEmailReply();

    const handleArchive = async () => {
        if (!emailId) return;

        try {
            await archiveEmail.mutateAsync(emailId);
            toast.success('Surat berhasil diarsipkan');
            navigate('/emails');
        } catch {
            toast.error('Gagal mengarsipkan surat');
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) {
            toast.error('Isi balasan tidak boleh kosong');
            return;
        }
        if (!emailId) return;

        try {
            await createReply.mutateAsync({
                email_id: emailId,
                isi: replyText,
                files: replyFiles.length > 0 ? replyFiles : undefined,
            });
            toast.success('Balasan berhasil dikirim');
            setReplyText('');
            setReplyFiles([]);
            setShowReplyForm(false);
        } catch {
            toast.error('Gagal mengirim balasan');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        const validFiles: File[] = [];

        for (const file of newFiles) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" terlalu besar. Maksimal 10MB.`);
                continue;
            }
            validFiles.push(file);
        }

        setReplyFiles((prev) => [...prev, ...validFiles]);

        // Reset input value
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setReplyFiles((prev) => prev.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
                </div>
            </PageTransition>
        );
    }

    if (isError || !email) {
        return (
            <PageTransition>
                <EmptyState
                    icon={<Mail className="h-8 w-8" />}
                    title="Surat tidak ditemukan"
                    description="Surat yang Anda cari tidak ditemukan atau Anda tidak memiliki akses."
                    className="rounded-lg border border-slate-200 bg-white"
                />
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
                        title="Detail Surat"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/emails')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                {/* Letter-style card */}
                <motion.div
                    variants={staggerItem}
                    className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                    {/* Header */}
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {email.name_surat}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        {email.no_surat || '-'}
                                    </span>
                                    <StatusBadge status={email.status} size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sender / Recipient info */}
                    <div className="border-b border-slate-100 px-6 py-3">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-500">Dari:</span>
                                <span className="font-medium text-slate-700">
                                    {email.user?.name || '-'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-500">Kepada:</span>
                                <span className="font-medium text-slate-700">
                                    {getRecipientsDisplay(email)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-500">Tanggal:</span>
                                <span className="font-medium text-slate-700">
                                    {formatDate(email.tgl_surat)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                            {email.isi_surat}
                        </div>
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="border-t border-slate-100 px-6 py-4">
                            <h4 className="mb-2 text-sm font-semibold text-slate-700">
                                Lampiran ({email.attachments.length})
                            </h4>
                            <div className="space-y-2">
                                {email.attachments.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                                    >
                                        <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-700">
                                                {file.nama}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile(file)}
                                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                                            title="Preview"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
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
                        </div>
                    )}
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    variants={staggerItem}
                    className="mb-6 flex flex-wrap items-center gap-2"
                >
                    <button
                        type="button"
                        onClick={handleArchive}
                        disabled={archiveEmail.isPending}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        {archiveEmail.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Archive className="h-4 w-4" />
                        )}
                        Arsipkan
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowReplyForm(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Reply className="h-4 w-4" />
                        Balas
                    </button>
                </motion.div>

                {/* Replies */}
                <motion.div variants={staggerItem}>
                    <h3 className="mb-4 text-base font-semibold text-slate-900">
                        Balasan ({email.replies?.length || 0})
                    </h3>

                    <div className="space-y-3">
                        {email.replies?.map((reply) => (
                            <div
                                key={reply.id}
                                className="rounded-lg border border-slate-200 bg-white p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {reply.user?.name || 'User'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {formatDateTime(reply.created_at)}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">{reply.isi}</p>

                                {/* Reply Attachments */}
                                {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-3 border-t border-slate-100 pt-3">
                                        <p className="mb-2 text-xs font-medium text-slate-500">
                                            Lampiran ({reply.attachments.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {reply.attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5"
                                                >
                                                    <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                                    <span className="max-w-[150px] truncate text-xs text-slate-600">
                                                        {file.nama}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewFile(file)}
                                                        className="rounded p-0.5 text-slate-400 hover:text-blue-600"
                                                        title="Preview"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                    <a
                                                        href={file.path}
                                                        download
                                                        className="rounded p-0.5 text-slate-400 hover:text-blue-600"
                                                        title="Download"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Reply form */}
                    {showReplyForm && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 rounded-lg border border-blue-200 bg-white p-4"
                        >
                            <h4 className="mb-2 text-sm font-semibold text-slate-700">
                                Tulis Balasan
                            </h4>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Tulis balasan Anda..."
                                rows={4}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />

                            {/* File Upload Section */}
                            <div className="mt-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Lampirkan File
                                </button>

                                {/* Selected Files List */}
                                {replyFiles.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {replyFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1"
                                            >
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                                <span className="max-w-40 truncate text-xs text-slate-600">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    ({(file.size / 1024).toFixed(0)} KB)
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="rounded p-0.5 text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReplyForm(false);
                                        setReplyText('');
                                        setReplyFiles([]);
                                    }}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReply}
                                    disabled={createReply.isPending}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createReply.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Kirim
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* File Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                open={previewFile !== null}
                onClose={() => setPreviewFile(null)}
            />
        </PageTransition>
    );
}
