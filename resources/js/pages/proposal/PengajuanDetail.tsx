import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    Pencil,
    Printer,
    Download,
    FileText,
    Eye,
    X,
    FileImage,
    File,
    Send,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApprovalTimeline } from '@/components/common/ApprovalTimeline';
import { formatRupiah, formatVolume } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { usePengajuan, useSubmitPengajuan, useResubmitPengajuan } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import type { Attachment } from '@/types/models';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'items' | 'approval' | 'lampiran';

// ---------------------------------------------------------------------------
// Attachment helpers
// ---------------------------------------------------------------------------

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return FileImage;
    if (mimeType === 'application/pdf') return FileText;
    return File;
}

function isPreviewable(mimeType: string): boolean {
    return (
        mimeType?.startsWith('image/') ||
        mimeType === 'application/pdf'
    );
}

function getFileUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `/storage/${path}`;
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
    const isImage = file.mime_type?.startsWith('image/');
    const fileUrl = getFileUrl(file.path);

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
                                href={fileUrl}
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
                                src={fileUrl}
                                className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
                                title={file.nama}
                            />
                        )}
                        {isImage && (
                            <div className="flex items-center justify-center">
                                <img
                                    src={fileUrl}
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
                                    href={fileUrl}
                                    download
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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

export default function PengajuanDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('items');
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

    const { user } = useAuth();
    const pengajuanId = id ? parseInt(id, 10) : null;
    const { data: pengajuan, isLoading, isError, error } = usePengajuan(pengajuanId);
    const submitMutation = useSubmitPengajuan();
    const resubmitMutation = useResubmitPengajuan();

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-slate-600">Memuat data pengajuan...</span>
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError || !pengajuan) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="mt-4 text-lg font-medium text-slate-900">Gagal memuat data</p>
                    <p className="mt-1 text-sm text-slate-500">
                        {error instanceof Error ? error.message : 'Pengajuan tidak ditemukan.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/pengajuan')}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar
                    </button>
                </div>
            </PageTransition>
        );
    }

    const isCreator = pengajuan.user_id === user?.id;
    const statusValue = typeof pengajuan.status_proses === 'string'
        ? pengajuan.status_proses
        : pengajuan.status_proses;
    const canEdit = statusValue === 'draft' || statusValue === 'revision-required';
    const canSubmit = statusValue === 'draft' && isCreator;
    const canResubmit = statusValue === 'revision-required' && isCreator;

    const details = pengajuan.detail_pengajuans ?? [];
    const attachments = pengajuan.attachments ?? [];
    const approvals = pengajuan.approvals ?? [];

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'items', label: 'Detail Item' },
        { key: 'approval', label: 'Approval' },
        { key: 'lampiran', label: `Lampiran (${attachments.length})` },
    ];

    const handleSubmit = async () => {
        if (!pengajuanId) return;

        try {
            await submitMutation.mutateAsync(pengajuanId);
            toast.success('Pengajuan berhasil diajukan untuk approval!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal mengajukan pengajuan';
            toast.error(errorMessage);
        }
    };

    const handleResubmit = async () => {
        if (!pengajuanId) return;

        try {
            await resubmitMutation.mutateAsync(pengajuanId);
            toast.success('Pengajuan berhasil diajukan kembali!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal mengajukan kembali';
            toast.error(errorMessage);
        }
    };

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Detail Pengajuan"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/pengajuan')}
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
                                <h2 className="text-xl font-bold text-slate-900">
                                    {pengajuan.nama_pengajuan || pengajuan.perihal || '-'}
                                </h2>
                                <StatusBadge status={statusValue} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                                <span>No: <span className="font-medium text-blue-600">{pengajuan.no_surat || pengajuan.nomor_pengajuan || '-'}</span></span>
                                <span>Unit: <span className="font-medium text-slate-700">{pengajuan.unit?.nama || '-'}</span></span>
                                <span>Tahun: <span className="font-medium text-slate-700">{pengajuan.tahun_anggaran || '-'}</span></span>
                                <span>Pengaju: <span className="font-medium text-slate-700">{pengajuan.user?.name || '-'}</span></span>
                                {pengajuan.waktu_kegiatan && (
                                    <span>Waktu: <span className="font-medium text-slate-700">{pengajuan.waktu_kegiatan}</span></span>
                                )}
                                {pengajuan.tempat && (
                                    <span>Tempat: <span className="font-medium text-slate-700">{pengajuan.tempat}</span></span>
                                )}
                                <span>Dibuat: <span className="font-medium text-slate-700">{formatDate(pengajuan.created_at)}</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-500">Total Pengajuan</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatRupiah(pengajuan.jumlah_pengajuan_total || 0)}
                            </p>
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
                                        layoutId="pengajuan-tab-indicator"
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
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Vol</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Satuan</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Harga Satuan</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {details.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                                    Tidak ada detail item.
                                                </td>
                                            </tr>
                                        ) : (
                                            details.map((detail, index) => (
                                                <tr key={detail.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                    <td className="px-4 py-3 text-slate-700">
                                                        {detail.mata_anggaran
                                                            ? `${detail.mata_anggaran.kode} - ${detail.mata_anggaran.nama}`
                                                            : detail.detail_mata_anggaran?.mata_anggaran
                                                                ? `${detail.detail_mata_anggaran.mata_anggaran.kode} - ${detail.detail_mata_anggaran.mata_anggaran.nama}`
                                                                : '-'
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">
                                                        {detail.sub_mata_anggaran
                                                            ? `${detail.sub_mata_anggaran.kode} - ${detail.sub_mata_anggaran.nama}`
                                                            : detail.detail_mata_anggaran?.sub_mata_anggaran
                                                                ? `${detail.detail_mata_anggaran.sub_mata_anggaran.kode} - ${detail.detail_mata_anggaran.sub_mata_anggaran.nama}`
                                                                : '-'
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">
                                                        {detail.uraian || detail.detail_mata_anggaran?.nama || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{detail.volume != null ? formatVolume(detail.volume) : '-'}</td>
                                                    <td className="px-4 py-3 text-slate-700">{detail.satuan || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">
                                                        {detail.harga_satuan ? formatRupiah(detail.harga_satuan) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                        {formatRupiah(detail.jumlah || 0)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                                            <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-right text-base font-bold text-blue-600">
                                                {formatRupiah(pengajuan.jumlah_pengajuan_total || 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'approval' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Alur Persetujuan
                            </h3>
                            {approvals.length > 0 ? (
                                <ApprovalTimeline
                                    approvals={approvals}
                                    currentStage={pengajuan.current_approval_stage}
                                />
                            ) : (
                                <p className="text-sm text-slate-500">
                                    {statusValue === 'draft'
                                        ? 'Pengajuan belum diajukan untuk approval.'
                                        : 'Tidak ada data approval.'}
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'lampiran' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Dokumen Lampiran
                            </h3>
                            {attachments.length === 0 ? (
                                <p className="text-sm text-slate-500">Tidak ada lampiran.</p>
                            ) : (
                                <div className="space-y-2">
                                    {attachments.map((file) => {
                                        const IconComponent = getFileIcon(file.mime_type);
                                        const canPreview = isPreviewable(file.mime_type);
                                        const fileUrl = getFileUrl(file.path);

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
                                                        onClick={() => setPreviewFile(file)}
                                                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-blue-600"
                                                        title="Lihat"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <a
                                                        href={fileUrl}
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
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    variants={staggerItem}
                    className="mt-6 flex flex-wrap items-center gap-2 print:hidden"
                >
                    {canSubmit && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Ajukan Pengajuan
                        </button>
                    )}

                    {canResubmit && (
                        <button
                            type="button"
                            onClick={handleResubmit}
                            disabled={resubmitMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {resubmitMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Ajukan Kembali
                        </button>
                    )}

                    {isCreator && canEdit && (
                        <button
                            type="button"
                            onClick={() => navigate(`/pengajuan/${id}/edit`)}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak
                    </button>
                </motion.div>
            </motion.div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </PageTransition>
    );
}
