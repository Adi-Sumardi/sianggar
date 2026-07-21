import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { getFileUrl } from '@/lib/fileUrl';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useLpj, useUpdateLpj, useSubmitLpj, useResubmitLpj, useUploadLpjAttachment } from '@/hooks/useLpj';
import { LpjStatus } from '@/types/enums';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LpjEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const lpjId = id ?? null;

    const { data: lpj, isLoading, isError, error } = useLpj(lpjId);

    const updateMutation = useUpdateLpj();
    const submitMutation = useSubmitLpj();
    const resubmitMutation = useResubmitLpj();
    const uploadMutation = useUploadLpjAttachment();

    // Form state
    const [realisasi, setRealisasi] = useState(0);
    const [deskripsi, setDeskripsi] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    // Prefill form once LPJ data loads
    useEffect(() => {
        if (lpj) {
            setRealisasi(lpj.input_realisasi ?? 0);
            setDeskripsi(lpj.deskripsi_singkat ?? '');
        }
    }, [lpj]);

    const existingFiles = useMemo(() => {
        if (!lpj?.attachments) return [];
        return lpj.attachments.map((a) => ({
            id: a.id,
            name: a.nama,
            url: getFileUrl(a.path),
        }));
    }, [lpj]);

    const sisaAnggaran = lpj ? lpj.jumlah_pengajuan_total - realisasi : 0;
    const isRevised = lpj?.proses === LpjStatus.Revised;
    const isDraft = lpj?.proses === LpjStatus.Draft;
    const isSubmitting = updateMutation.isPending || submitMutation.isPending || resubmitMutation.isPending || uploadMutation.isPending;

    const handleSave = async () => {
        if (!lpjId) return;

        try {
            await updateMutation.mutateAsync({
                id: lpjId,
                dto: { input_realisasi: realisasi, deskripsi_singkat: deskripsi || undefined },
            });

            for (const file of files) {
                await uploadMutation.mutateAsync({ lpjId, file });
            }

            toast.success('LPJ berhasil diperbarui');
            navigate(`/lpj/${lpj?.ulid ?? lpjId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui LPJ');
            console.error(error);
        }
    };

    const handleResubmit = async () => {
        if (!lpjId) return;
        if (realisasi <= 0) {
            toast.error('Masukkan jumlah realisasi');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: lpjId,
                dto: { input_realisasi: realisasi, deskripsi_singkat: deskripsi || undefined },
            });

            for (const file of files) {
                await uploadMutation.mutateAsync({ lpjId, file });
            }

            // LPJ berstatus Draft belum pernah masuk approval sama sekali ->
            // pakai submit(). Revised sudah pernah masuk lalu dikembalikan ->
            // pakai resubmit() supaya balik ke tahap approval yang meminta revisi.
            if (isDraft) {
                await submitMutation.mutateAsync(lpjId);
            } else {
                await resubmitMutation.mutateAsync(lpjId);
            }

            toast.success('LPJ berhasil diajukan untuk persetujuan');
            navigate('/lpj');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengajukan LPJ');
            console.error(error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-slate-600">Memuat data LPJ...</span>
                </div>
            </PageTransition>
        );
    }

    // Error / not found / not editable
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

    if (!lpj.is_editable) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-slate-600">
                        LPJ ini tidak dapat diedit pada status saat ini ({lpj.proses_label}).
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate(`/lpj/${lpj.ulid ?? lpj.id}`)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke detail LPJ
                    </button>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Edit LPJ"
                        description={
                            isRevised
                                ? 'LPJ dikembalikan untuk revisi - perbaiki lalu ajukan kembali'
                                : isDraft
                                    ? 'LPJ masih draft - lengkapi lalu ajukan untuk persetujuan'
                                    : 'Perbarui data LPJ'
                        }
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate(`/lpj/${lpj.ulid ?? lpj.id}`)}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Informasi LPJ
                            </h3>

                            <div className="space-y-5">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">No. Surat</p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{lpj.no_surat ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Perihal</p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{lpj.perihal}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Tanggal Kegiatan</p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                                {lpj.tgl_kegiatan ? formatDate(lpj.tgl_kegiatan) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Anggaran info */}
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs font-medium text-blue-600">Total Anggaran</p>
                                            <p className="mt-0.5 text-lg font-bold text-blue-700">
                                                {formatRupiah(lpj.jumlah_pengajuan_total)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-600">Realisasi</p>
                                            <p className="mt-0.5 text-lg font-bold text-slate-900">
                                                {formatRupiah(realisasi)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-600">Sisa Anggaran</p>
                                            <p
                                                className={`mt-0.5 text-lg font-bold ${
                                                    sisaAnggaran >= 0 ? 'text-emerald-600' : 'text-red-600'
                                                }`}
                                            >
                                                {formatRupiah(sisaAnggaran)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Realisasi */}
                                <CurrencyInput
                                    label="Jumlah Realisasi"
                                    value={realisasi}
                                    onChange={setRealisasi}
                                    error={
                                        realisasi > lpj.jumlah_pengajuan_total
                                            ? 'Realisasi melebihi anggaran yang disetujui'
                                            : undefined
                                    }
                                />

                                {/* Deskripsi */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Deskripsi Singkat
                                    </label>
                                    <textarea
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        placeholder="Jelaskan realisasi penggunaan anggaran..."
                                        rows={4}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lampiran */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-2 text-base font-semibold text-slate-900">
                                Lampiran
                            </h3>
                            <p className="mb-4 text-xs text-slate-500">
                                Upload bukti pengeluaran seperti kwitansi, nota, atau dokumen pendukung lainnya.
                            </p>
                            <FileUpload
                                onFilesSelected={setFiles}
                                existingFiles={existingFiles}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                multiple
                                maxSize={10}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/lpj/${lpj.ulid ?? lpj.id}`)}
                                disabled={isSubmitting}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Simpan
                            </button>
                            {(isRevised || isDraft) && (
                                <button
                                    type="button"
                                    onClick={handleResubmit}
                                    disabled={isSubmitting || realisasi <= 0}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {isRevised ? 'Ajukan Kembali' : 'Ajukan'}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
