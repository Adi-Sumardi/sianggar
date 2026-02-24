import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Save, Loader2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAvailableForLpj } from '@/hooks/useProposals';
import { useCreateLpj, useSubmitLpj, useUploadLpjAttachment } from '@/hooks/useLpj';
import type { PengajuanAnggaran } from '@/types/models';
import { getCurrentAcademicYear } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LpjCreate() {
    const navigate = useNavigate();

    // Fetch available pengajuan for LPJ
    const { data: availablePengajuan, isLoading: isLoadingPengajuan, error: pengajuanError } = useAvailableForLpj();

    // Mutations
    const createLpjMutation = useCreateLpj();
    const submitLpjMutation = useSubmitLpj();
    const uploadAttachmentMutation = useUploadLpjAttachment();

    // Form state
    const [selectedPengajuanId, setSelectedPengajuanId] = useState<number | null>(null);
    const [realisasi, setRealisasi] = useState(0);
    const [deskripsi, setDeskripsi] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    // Get selected pengajuan data
    const selectedPengajuan = useMemo(() => {
        if (!selectedPengajuanId || !availablePengajuan) return null;
        return availablePengajuan.find((p) => p.id === selectedPengajuanId) ?? null;
    }, [selectedPengajuanId, availablePengajuan]);

    const sisaAnggaran = selectedPengajuan
        ? (selectedPengajuan.approved_amount ?? selectedPengajuan.jumlah_pengajuan_total) - realisasi
        : 0;

    const isSubmitting = createLpjMutation.isPending || submitLpjMutation.isPending || uploadAttachmentMutation.isPending;

    // Handle save as draft
    const handleSaveDraft = async () => {
        if (!selectedPengajuan) {
            toast.error('Pilih pengajuan terkait');
            return;
        }

        try {
            const lpj = await createLpjMutation.mutateAsync({
                pengajuan_anggaran_id: selectedPengajuan.id,
                unit: selectedPengajuan.unit ?? '',
                perihal: selectedPengajuan.nama_pengajuan ?? 'LPJ',
                tahun: selectedPengajuan.tahun ?? getCurrentAcademicYear(),
                jumlah_pengajuan_total: selectedPengajuan.approved_amount ?? selectedPengajuan.jumlah_pengajuan_total,
                input_realisasi: realisasi,
                deskripsi_singkat: deskripsi || undefined,
                mata_anggaran: selectedPengajuan.details?.[0]?.mata_anggaran?.nama,
            });

            // Upload attachments if any
            for (const file of files) {
                await uploadAttachmentMutation.mutateAsync({ lpjId: lpj.id, file });
            }

            toast.success('LPJ berhasil disimpan sebagai draft');
            navigate(`/lpj/${lpj.id}`);
        } catch (error) {
            toast.error('Gagal menyimpan LPJ');
            console.error(error);
        }
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPengajuan) {
            toast.error('Pilih pengajuan terkait');
            return;
        }
        if (realisasi <= 0) {
            toast.error('Masukkan jumlah realisasi');
            return;
        }

        try {
            // Create LPJ first
            const lpj = await createLpjMutation.mutateAsync({
                pengajuan_anggaran_id: selectedPengajuan.id,
                unit: selectedPengajuan.unit ?? '',
                perihal: selectedPengajuan.nama_pengajuan ?? 'LPJ',
                tahun: selectedPengajuan.tahun ?? getCurrentAcademicYear(),
                jumlah_pengajuan_total: selectedPengajuan.approved_amount ?? selectedPengajuan.jumlah_pengajuan_total,
                input_realisasi: realisasi,
                deskripsi_singkat: deskripsi || undefined,
                mata_anggaran: selectedPengajuan.details?.[0]?.mata_anggaran?.nama,
            });

            // Upload attachments if any
            for (const file of files) {
                await uploadAttachmentMutation.mutateAsync({ lpjId: lpj.id, file });
            }

            // Submit for approval
            await submitLpjMutation.mutateAsync(lpj.id);

            toast.success('LPJ berhasil diajukan untuk persetujuan');
            navigate('/lpj');
        } catch (error) {
            toast.error('Gagal mengajukan LPJ');
            console.error(error);
        }
    };

    // Format pengajuan option label
    const formatPengajuanLabel = (p: PengajuanAnggaran) => {
        const amount = p.approved_amount ?? p.jumlah_pengajuan_total;
        return `${p.no_surat ?? `PA/${p.tahun}/${p.id}`} - ${p.nama_pengajuan} (${formatRupiah(amount)})`;
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
                        title="Buat LPJ"
                        description="Buat laporan pertanggungjawaban untuk pengajuan yang telah disetujui"
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

                <motion.div variants={staggerItem}>
                    {/* Loading state */}
                    {isLoadingPengajuan && (
                        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            <span className="ml-2 text-slate-500">Memuat data pengajuan...</span>
                        </div>
                    )}

                    {/* Error state */}
                    {pengajuanError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-5 w-5" />
                                <span>Gagal memuat data pengajuan. Silakan coba lagi.</span>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoadingPengajuan && !pengajuanError && availablePengajuan?.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                Tidak ada pengajuan yang tersedia
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Belum ada pengajuan yang memerlukan LPJ atau semua pengajuan sudah memiliki LPJ.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/lpj')}
                                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Kembali ke daftar LPJ
                            </button>
                        </div>
                    )}

                    {/* Form */}
                    {!isLoadingPengajuan && !pengajuanError && availablePengajuan && availablePengajuan.length > 0 && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="rounded-lg border border-slate-200 bg-white p-6">
                                <h3 className="mb-4 text-base font-semibold text-slate-900">
                                    Informasi LPJ
                                </h3>

                                <div className="space-y-5">
                                    {/* Select Pengajuan */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Pengajuan Terkait <span className="text-red-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={availablePengajuan.map((p) => ({
                                                value: String(p.id),
                                                label: p.no_surat ?? `PA/${p.tahun}/${p.id}`,
                                                description: `${p.nama_pengajuan} - ${formatRupiah(p.approved_amount ?? p.jumlah_pengajuan_total)}`,
                                            }))}
                                            value={selectedPengajuanId ? String(selectedPengajuanId) : ''}
                                            onChange={(val) => setSelectedPengajuanId(val ? Number(val) : null)}
                                            placeholder="Pilih pengajuan yang telah disetujui"
                                            searchPlaceholder="Cari no. surat atau nama pengajuan..."
                                            emptyMessage="Tidak ada pengajuan tersedia"
                                        />
                                    </div>

                                    {/* Anggaran info */}
                                    {selectedPengajuan && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-xs font-medium text-blue-600">Total Anggaran</p>
                                                    <p className="mt-0.5 text-lg font-bold text-blue-700">
                                                        {formatRupiah(selectedPengajuan.approved_amount ?? selectedPengajuan.jumlah_pengajuan_total)}
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
                                    )}

                                    {/* Realisasi */}
                                    <CurrencyInput
                                        label="Jumlah Realisasi"
                                        value={realisasi}
                                        onChange={setRealisasi}
                                        error={
                                            selectedPengajuan && realisasi > (selectedPengajuan.approved_amount ?? selectedPengajuan.jumlah_pengajuan_total)
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
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    multiple
                                    maxSize={10}
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/lpj')}
                                    disabled={isSubmitting}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting || !selectedPengajuan}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Simpan Draft
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedPengajuan || realisasi <= 0}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Submit LPJ
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
