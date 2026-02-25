import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ListChecks,
    Paperclip,
    ClipboardCheck,
    Trash2,
    AlertTriangle,
    Loader2,
    MessageSquare,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { BudgetInfoCard } from '@/components/common/BudgetInfoCard';
import { InsufficientBudgetModal } from '@/components/common/InsufficientBudgetModal';
import { RevisionCommentThread } from '@/components/common/RevisionCommentThread';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { BudgetCheckResultItem } from '@/types/api';
import {
    usePengajuan,
    useUpdatePengajuan,
    useResubmitPengajuan,
    useUploadPengajuanAttachment,
    useDeletePengajuanAttachment,
} from '@/hooks/useProposals';
import { getStageLabel, ApprovalStatus } from '@/types/enums';
import type { DetailPengajuan, Approval } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemRow {
    id: number;
    mata_anggaran_id: number | null;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    uraian: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    jumlah: number;
    mata_anggaran_label?: string;
    // Budget info
    budget_kode?: string;
    budget_anggaran_awal?: number;
    budget_saldo_dipakai?: number;
    budget_saldo_tersedia?: number;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const steps = [
    { id: 1, label: 'Catatan Revisi', icon: MessageSquare },
    { id: 2, label: 'Detail Item', icon: ListChecks },
    { id: 3, label: 'Lampiran', icon: Paperclip },
    { id: 4, label: 'Review', icon: ClipboardCheck },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PengajuanRevise() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    // Fetch pengajuan data
    const { data: pengajuan, isLoading, isError, error, refetch } = usePengajuan(id ? parseInt(id) : null);
    const updateMutation = useUpdatePengajuan();
    const resubmitMutation = useResubmitPengajuan();
    const uploadAttachment = useUploadPengajuanAttachment();
    const deleteAttachment = useDeletePengajuanAttachment();

    // Local state for editing
    const [items, setItems] = useState<ItemRow[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    // Budget validation modal
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [insufficientItems, setInsufficientItems] = useState<BudgetCheckResultItem[]>([]);

    // Initialize items from pengajuan data
    useEffect(() => {
        if (pengajuan?.detail_pengajuans && items.length === 0) {
            setItems(
                pengajuan.detail_pengajuans.map((d: DetailPengajuan) => {
                    // Parse values to ensure they're numbers (API might return strings)
                    const volume = parseFloat(String(d.volume)) || 1;
                    const hargaSatuan = parseFloat(String(d.harga_satuan)) || 0;
                    const jumlah = parseFloat(String(d.jumlah)) || (volume * hargaSatuan);
                    const detailMA = d.detail_mata_anggaran;

                    return {
                        id: d.id,
                        mata_anggaran_id: d.mata_anggaran_id,
                        sub_mata_anggaran_id: d.sub_mata_anggaran_id,
                        detail_mata_anggaran_id: d.detail_mata_anggaran_id,
                        uraian: d.uraian || '',
                        volume,
                        satuan: d.satuan || 'unit',
                        harga_satuan: hargaSatuan,
                        jumlah,
                        mata_anggaran_label: d.mata_anggaran?.nama || detailMA?.nama || '-',
                        // Budget info from detail_mata_anggaran
                        budget_kode: detailMA?.kode,
                        budget_anggaran_awal: detailMA?.anggaran_awal ?? 0,
                        budget_saldo_dipakai: detailMA?.saldo_dipakai ?? 0,
                        budget_saldo_tersedia: detailMA?.saldo_tersedia ?? 0,
                    };
                })
            );
        }
    }, [pengajuan, items.length]);

    // Get revision notes from the latest approval with 'revised' status
    const revisionInfo = useMemo(() => {
        if (!pengajuan?.approvals) return null;

        const revisedApproval = pengajuan.approvals.find(
            (a: Approval) => a.status === ApprovalStatus.Revised || a.status === 'revised'
        );

        if (!revisedApproval) return null;

        return {
            notes: revisedApproval.notes || 'Tidak ada catatan revisi.',
            approver: revisedApproval.approver?.name || 'Approver',
            stage: revisedApproval.stage,
            date: revisedApproval.approved_at,
        };
    }, [pengajuan]);

    // Get existing attachments
    const existingFiles = useMemo(() => {
        if (!pengajuan?.attachments) return [];
        return pengajuan.attachments.map((a) => ({
            id: a.id,
            name: a.nama,
            url: `/storage/${a.path}`,
            mime_type: a.mime_type,
        }));
    }, [pengajuan]);

    // Handle delete existing attachment
    const handleDeleteExisting = async (attachmentId: number) => {
        if (!pengajuan) return;

        try {
            await deleteAttachment.mutateAsync({
                pengajuanId: pengajuan.id,
                attachmentId,
            });
            toast.success('File berhasil dihapus');
            refetch();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus file');
        }
    };

    // Handle upload new files
    const handleUploadFiles = async (filesToUpload: File[]) => {
        if (!pengajuan || filesToUpload.length === 0) return;

        for (const file of filesToUpload) {
            try {
                await uploadAttachment.mutateAsync({
                    pengajuanId: pengajuan.id,
                    file,
                });
            } catch (err: any) {
                toast.error(`Gagal mengupload ${file.name}: ${err.response?.data?.message || 'Error'}`);
            }
        }
        toast.success('File berhasil diupload');
        setFiles([]); // Clear new files after upload
        refetch();
    };

    // ---------------------------------------------------------------------------
    // Item helpers
    // ---------------------------------------------------------------------------

    const updateItem = useCallback((itemId: number, field: keyof ItemRow, value: string | number) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;
                const updated = { ...item, [field]: value };
                // Recalculate jumlah when volume or harga_satuan changes
                if (field === 'volume' || field === 'harga_satuan') {
                    const vol = parseFloat(String(updated.volume)) || 0;
                    const harga = parseFloat(String(updated.harga_satuan)) || 0;
                    updated.jumlah = vol * harga;
                }
                return updated;
            })
        );
    }, []);

    const runningTotal = items.reduce((sum, item) => {
        const jumlah = parseFloat(String(item.jumlah)) || 0;
        return sum + jumlah;
    }, 0);

    // Check budget sufficiency before resubmit
    const checkBudgetSufficiency = useCallback(() => {
        const insufficient: BudgetCheckResultItem[] = [];

        for (const item of items) {
            if (!item.detail_mata_anggaran_id || item.budget_saldo_tersedia == null) continue;

            if (item.jumlah > item.budget_saldo_tersedia) {
                insufficient.push({
                    detail_mata_anggaran_id: item.detail_mata_anggaran_id,
                    kode: item.budget_kode || '',
                    nama: item.mata_anggaran_label || '',
                    anggaran_awal: item.budget_anggaran_awal || 0,
                    saldo_dipakai: item.budget_saldo_dipakai || 0,
                    saldo_tersedia: item.budget_saldo_tersedia || 0,
                    jumlah_diminta: item.jumlah,
                    is_sufficient: false,
                    kekurangan: item.jumlah - (item.budget_saldo_tersedia || 0),
                });
            }
        }

        return insufficient;
    }, [items]);

    const handleContactFinance = () => {
        window.open('https://wa.me/6281234567890?text=Halo Tim Keuangan, saya ingin konsultasi mengenai revisi pengajuan anggaran.', '_blank');
        setShowBudgetModal(false);
    };

    const canProceed = () => {
        if (currentStep === 2) return items.length > 0 && items.every((i) => i.jumlah > 0);
        return true;
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep((s) => s + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    const handleSave = async () => {
        if (!pengajuan) return;

        try {
            await updateMutation.mutateAsync({
                id: pengajuan.id,
                dto: {
                    details: items.map((item) => ({
                        detail_mata_anggaran_id: item.detail_mata_anggaran_id,
                        mata_anggaran_id: item.mata_anggaran_id,
                        sub_mata_anggaran_id: item.sub_mata_anggaran_id,
                        uraian: item.uraian,
                        volume: item.volume,
                        satuan: item.satuan,
                        harga_satuan: item.harga_satuan,
                        jumlah: item.jumlah,
                    })),
                },
            });
            toast.success('Perubahan berhasil disimpan');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan');
        }
    };

    const handleResubmit = async () => {
        if (!pengajuan) return;

        // Check budget sufficiency first
        const insufficient = checkBudgetSufficiency();
        if (insufficient.length > 0) {
            setInsufficientItems(insufficient);
            setShowBudgetModal(true);
            return;
        }

        try {
            // Save changes first
            await updateMutation.mutateAsync({
                id: pengajuan.id,
                dto: {
                    details: items.map((item) => ({
                        detail_mata_anggaran_id: item.detail_mata_anggaran_id,
                        mata_anggaran_id: item.mata_anggaran_id,
                        sub_mata_anggaran_id: item.sub_mata_anggaran_id,
                        uraian: item.uraian,
                        volume: item.volume,
                        satuan: item.satuan,
                        harga_satuan: item.harga_satuan,
                        jumlah: item.jumlah,
                    })),
                },
            });

            // Then resubmit
            await resubmitMutation.mutateAsync(pengajuan.id);
            toast.success('Pengajuan berhasil diajukan kembali');
            navigate('/pengajuan');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengajukan kembali pengajuan');
        }
    };

    // ---------------------------------------------------------------------------
    // Render steps
    // ---------------------------------------------------------------------------

    const renderStep1 = () => (
        <motion.div
            key="revise-step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
        >
            {/* Revision Notes Card */}
            <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-800">Catatan Revisi dari Approver</h3>
                        {revisionInfo ? (
                            <>
                                <div className="mt-2 rounded-md bg-white p-4 shadow-sm">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{revisionInfo.notes}</p>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-orange-700">
                                    <span>
                                        <strong>Oleh:</strong> {revisionInfo.approver}
                                    </span>
                                    <span>
                                        <strong>Tahap:</strong> {getStageLabel(revisionInfo.stage as string)}
                                    </span>
                                    {revisionInfo.date && (
                                        <span>
                                            <strong>Tanggal:</strong> {formatDate(revisionInfo.date)}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="mt-2 text-sm text-orange-700">Tidak ada catatan revisi.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Info yang tidak bisa diubah */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">Informasi Pengajuan</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Perihal</p>
                        <p className="mt-0.5 text-sm text-slate-900">{pengajuan?.nama_pengajuan || pengajuan?.perihal || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">No. Surat</p>
                        <p className="mt-0.5 text-sm text-slate-900">{pengajuan?.nomor_pengajuan || pengajuan?.no_surat || '-'}</p>
                    </div>
                </div>
            </div>

            {/* What can be revised */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="text-sm font-semibold text-blue-800">Yang Dapat Direvisi:</h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                    <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-600" /> Detail item (uraian, volume, harga satuan)
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-600" /> Lampiran (tambah/hapus file)
                    </li>
                </ul>
                <h4 className="mt-3 text-sm font-semibold text-slate-600">Yang Tidak Dapat Diubah:</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                        <span className="h-4 w-4 text-center">✕</span> Mata anggaran
                    </li>
                </ul>
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div
            key="revise-step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            {items.map((item, index) => {
                const hasBudgetInfo = item.budget_saldo_tersedia != null;
                const isBudgetInsufficient = hasBudgetInfo && item.jumlah > (item.budget_saldo_tersedia ?? 0);

                return (
                <div
                    key={item.id}
                    className={cn(
                        'rounded-lg border bg-white p-4',
                        isBudgetInsufficient ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
                    )}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Item #{index + 1}</h4>
                    </div>

                    {/* Mata anggaran - readonly */}
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Mata Anggaran (tidak dapat diubah)</label>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            {item.mata_anggaran_label}
                        </div>
                    </div>

                    {/* Editable fields */}
                    <div className="grid gap-3 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600">Uraian</label>
                            <input
                                type="text"
                                value={item.uraian}
                                onChange={(e) => updateItem(item.id, 'uraian', e.target.value)}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Volume</label>
                            <input
                                type="number"
                                min={1}
                                value={item.volume}
                                onChange={(e) => updateItem(item.id, 'volume', parseInt(e.target.value) || 0)}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Satuan</label>
                            <input
                                type="text"
                                value={item.satuan}
                                onChange={(e) => updateItem(item.id, 'satuan', e.target.value)}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <CurrencyInput
                                label="Harga Satuan"
                                value={item.harga_satuan}
                                onChange={(val) => updateItem(item.id, 'harga_satuan', val)}
                            />
                        </div>
                        <div className="flex items-end">
                            <div className={cn(
                                'w-full rounded-md border px-3 py-2',
                                isBudgetInsufficient
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-blue-200 bg-blue-50'
                            )}>
                                <p className={cn(
                                    'text-xs',
                                    isBudgetInsufficient ? 'text-red-600' : 'text-blue-600'
                                )}>Jumlah</p>
                                <p className={cn(
                                    'text-lg font-bold',
                                    isBudgetInsufficient ? 'text-red-700' : 'text-blue-700'
                                )}>{formatRupiah(item.jumlah)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Budget Info */}
                    {hasBudgetInfo && item.jumlah > 0 && (
                        <div className="mt-3">
                            <BudgetInfoCard
                                nama={item.mata_anggaran_label || ''}
                                kode={item.budget_kode}
                                anggaranAwal={item.budget_anggaran_awal || 0}
                                saldoDigunakan={item.budget_saldo_dipakai || 0}
                                saldoTersedia={item.budget_saldo_tersedia || 0}
                                jumlahDiminta={item.jumlah}
                                compact
                            />
                        </div>
                    )}
                </div>
                );
            })}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Total Pengajuan</span>
                    <span className="text-xl font-bold text-blue-700">{formatRupiah(runningTotal)}</span>
                </div>
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div
            key="revise-step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            <div>
                <h3 className="mb-2 text-sm font-medium text-slate-700">Dokumen Pendukung</h3>
                <p className="mb-4 text-xs text-slate-500">
                    Anda dapat menambah file baru atau menghapus file yang sudah ada.
                </p>
                <FileUpload
                    onFilesSelected={setFiles}
                    onDeleteExisting={handleDeleteExisting}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                    multiple
                    maxSize={10}
                    existingFiles={existingFiles}
                    isDeleting={deleteAttachment.isPending}
                />
            </div>

            {/* Upload button for new files */}
            {files.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div>
                        <p className="text-sm font-medium text-blue-700">
                            {files.length} file baru siap diupload
                        </p>
                        <p className="text-xs text-blue-600">
                            Klik tombol untuk mengupload file sekarang
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleUploadFiles(files)}
                        disabled={uploadAttachment.isPending}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                        {uploadAttachment.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mengupload...
                            </>
                        ) : (
                            'Upload File'
                        )}
                    </button>
                </div>
            )}
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div
            key="revise-step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            {/* Revision notes reminder */}
            {revisionInfo && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h4 className="text-sm font-semibold text-orange-800">Catatan Revisi</h4>
                    <p className="mt-1 text-sm text-orange-700">{revisionInfo.notes}</p>
                </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="mb-4 text-base font-semibold text-slate-900">Ringkasan Revisi</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Perihal</p>
                        <p className="mt-0.5 text-sm text-slate-900">{pengajuan?.nama_pengajuan || pengajuan?.perihal || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Total Sebelumnya</p>
                        <p className="mt-0.5 text-sm text-slate-500 line-through">
                            {formatRupiah(pengajuan?.jumlah_pengajuan_total || 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-base font-semibold text-slate-900">Detail Item Setelah Revisi ({items.length})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left">
                                <th className="pb-2 pr-4 text-xs font-semibold uppercase text-slate-500">#</th>
                                <th className="pb-2 pr-4 text-xs font-semibold uppercase text-slate-500">Uraian</th>
                                <th className="pb-2 pr-4 text-xs font-semibold uppercase text-slate-500">Vol</th>
                                <th className="pb-2 pr-4 text-xs font-semibold uppercase text-slate-500">Satuan</th>
                                <th className="pb-2 text-right text-xs font-semibold uppercase text-slate-500">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="py-2 pr-4 text-slate-500">{index + 1}</td>
                                    <td className="py-2 pr-4 text-slate-700">{item.uraian || '-'}</td>
                                    <td className="py-2 pr-4 text-slate-700">{item.volume}</td>
                                    <td className="py-2 pr-4 text-slate-700">{item.satuan}</td>
                                    <td className="py-2 text-right font-medium text-slate-900">{formatRupiah(item.jumlah)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200">
                                <td colSpan={4} className="py-2 text-right text-sm font-semibold text-slate-700">Total Baru</td>
                                <td className="py-2 text-right text-base font-bold text-blue-600">{formatRupiah(runningTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Where it will go after resubmit */}
            {pengajuan?.revision_requested_stage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <h4 className="text-sm font-semibold text-emerald-800">Setelah Diajukan Kembali</h4>
                    <p className="mt-1 text-sm text-emerald-700">
                        Pengajuan akan kembali ke tahap <strong>{getStageLabel(pengajuan.revision_requested_stage as string)}</strong> untuk direview kembali.
                    </p>
                </div>
            )}
        </motion.div>
    );

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
                        onClick={() => navigate('/pengajuan')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke daftar pengajuan
                    </button>
                </div>
            </PageTransition>
        );
    }

    // Check if status is revision-required
    const status = typeof pengajuan.status_proses === 'string' ? pengajuan.status_proses : pengajuan.status_proses;
    if (status !== 'revision-required') {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-amber-500" />
                    <p className="text-sm text-slate-600">Pengajuan ini tidak memerlukan revisi.</p>
                    <button
                        type="button"
                        onClick={() => navigate(`/pengajuan/${id}`)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Lihat detail pengajuan
                    </button>
                </div>
            </PageTransition>
        );
    }

    const isSubmitting = updateMutation.isPending || resubmitMutation.isPending;

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Revisi Pengajuan Anggaran"
                        description={pengajuan.nama_pengajuan || pengajuan.perihal}
                    />
                </motion.div>

                {/* Progress bar */}
                <motion.div variants={staggerItem} className="mb-6">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                            className="h-full rounded-full bg-orange-500"
                            animate={{ width: `${(currentStep / 4) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </motion.div>

                {/* Step indicator */}
                <motion.div variants={staggerItem} className="mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => {
                                        if (isCompleted || isActive) setCurrentStep(step.id);
                                    }}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive ? 'bg-orange-50 text-orange-700' : isCompleted ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full',
                                            isActive ? 'bg-orange-500 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500',
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                                    </div>
                                    <span className="hidden sm:inline">{step.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Step {currentStep}/4: {steps[currentStep - 1].label}
                            </h2>
                        </div>

                        <AnimatePresence mode="wait">
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                        </AnimatePresence>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={currentStep === 1 ? () => navigate('/pengajuan') : prevStep}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {currentStep === 1 ? 'Batal' : 'Sebelumnya'}
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                                {currentStep === 4 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={isSubmitting}
                                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResubmit}
                                            disabled={isSubmitting}
                                            className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:opacity-50"
                                        >
                                            {resubmitMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                            Ajukan Kembali
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                        className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Selanjutnya
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Revision Comment Thread */}
            {pengajuan && (
                <RevisionCommentThread docType="pengajuan" docId={pengajuan.id} className="mt-6" />
            )}

            {/* Insufficient Budget Modal */}
            <InsufficientBudgetModal
                open={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                insufficientItems={insufficientItems}
                onContactFinance={handleContactFinance}
            />
        </PageTransition>
    );
}
