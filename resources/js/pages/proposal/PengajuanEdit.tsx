import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    ListChecks,
    Paperclip,
    ClipboardCheck,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { usePengajuan, useUpdatePengajuan, useResubmitPengajuan, useUploadPengajuanAttachment } from '@/hooks/useProposals';
import { useMataAnggarans, useSubMataAnggarans, useDetailMataAnggarans } from '@/hooks/useBudget';
import { useAuthStore } from '@/stores/authStore';
import type { UpdatePengajuanDTO } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemRow {
    id: string;
    detail_pengajuan_id?: number; // For existing items
    mata_anggaran_id: string;
    sub_mata_anggaran_id: string;
    detail_mata_anggaran_id: string;
    uraian: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    jumlah: number;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const steps = [
    { id: 1, label: 'Informasi Dasar', icon: FileText },
    { id: 2, label: 'Detail Item', icon: ListChecks },
    { id: 3, label: 'Lampiran', icon: Paperclip },
    { id: 4, label: 'Review', icon: ClipboardCheck },
];

function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PengajuanEdit() {
    const { id } = useParams();
    const pengajuanId = id ? parseInt(id, 10) : null;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);

    // Fetch existing pengajuan data
    const { data: pengajuan, isLoading: isLoadingPengajuan, error: pengajuanError } = usePengajuan(pengajuanId);

    // Mutations
    const updateMutation = useUpdatePengajuan();
    const resubmitMutation = useResubmitPengajuan();
    const uploadMutation = useUploadPengajuanAttachment();

    // Fetch budget data
    const { data: mataAnggaranData, isLoading: isLoadingMA } = useMataAnggarans();

    // Track which mata_anggaran_ids are used across all items for loading sub
    const [activeMataAnggaranId, setActiveMataAnggaranId] = useState<number | null>(null);
    const [activeSubMataAnggaranId, setActiveSubMataAnggaranId] = useState<number | null>(null);

    // Form state
    const [namaPengajuan, setNamaPengajuan] = useState('');
    const [tempat, setTempat] = useState('');
    const [waktuKegiatan, setWaktuKegiatan] = useState('');
    const [items, setItems] = useState<ItemRow[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load existing pengajuan data into form
    useEffect(() => {
        if (pengajuan && !isInitialized) {
            setNamaPengajuan(pengajuan.nama_pengajuan || '');
            setTempat(pengajuan.tempat || '');
            setWaktuKegiatan(pengajuan.waktu_kegiatan || '');

            // Map existing detail_pengajuans to items
            if (pengajuan.detail_pengajuans && pengajuan.detail_pengajuans.length > 0) {
                setItems(pengajuan.detail_pengajuans.map(detail => ({
                    id: generateId(),
                    detail_pengajuan_id: detail.id,
                    mata_anggaran_id: detail.mata_anggaran_id?.toString() || '',
                    sub_mata_anggaran_id: detail.sub_mata_anggaran_id?.toString() || '',
                    detail_mata_anggaran_id: detail.detail_mata_anggaran_id?.toString() || '',
                    uraian: detail.uraian || detail.detail_mata_anggaran?.nama || '',
                    volume: detail.volume || 1,
                    satuan: detail.satuan || 'unit',
                    harga_satuan: detail.harga_satuan || 0,
                    jumlah: detail.jumlah || 0,
                })));
            } else {
                setItems([{
                    id: generateId(),
                    mata_anggaran_id: '',
                    sub_mata_anggaran_id: '',
                    detail_mata_anggaran_id: '',
                    uraian: '',
                    volume: 1,
                    satuan: 'unit',
                    harga_satuan: 0,
                    jumlah: 0,
                }]);
            }
            setIsInitialized(true);
        }
    }, [pengajuan, isInitialized]);

    // Sub mata anggaran query - load when a mata_anggaran is active
    const { data: subMataAnggaranData, isLoading: isLoadingSMA } = useSubMataAnggarans(activeMataAnggaranId);

    // Detail mata anggaran query - load when a sub_mata_anggaran is active
    const { data: detailMataAnggaranData, isLoading: isLoadingDMA } = useDetailMataAnggarans(
        activeSubMataAnggaranId ? { sub_mata_anggaran_id: activeSubMataAnggaranId } : undefined
    );

    // Transform mata anggaran to options
    const mataAnggaranOptions = useMemo(() => {
        if (!mataAnggaranData?.data) return [];
        return mataAnggaranData.data.map(ma => ({
            value: ma.id.toString(),
            label: `${ma.kode} - ${ma.nama}`,
        }));
    }, [mataAnggaranData]);

    // Transform sub mata anggaran to options
    const subMataAnggaranOptions = useMemo(() => {
        if (!subMataAnggaranData?.data) return [];
        return subMataAnggaranData.data.map(sma => ({
            value: sma.id.toString(),
            label: `${sma.kode} - ${sma.nama}`,
        }));
    }, [subMataAnggaranData]);

    // Transform detail mata anggaran to options with saldo
    const detailMataAnggaranOptions = useMemo(() => {
        if (!detailMataAnggaranData?.data) return [];
        return detailMataAnggaranData.data.map(dma => ({
            value: dma.id.toString(),
            label: dma.nama,
            description: `Saldo: ${formatRupiah(dma.balance ?? 0)}`,
        }));
    }, [detailMataAnggaranData]);

    // ---------------------------------------------------------------------------
    // Item helpers
    // ---------------------------------------------------------------------------

    const addItem = useCallback(() => {
        setItems((prev) => [
            ...prev,
            {
                id: generateId(),
                mata_anggaran_id: '',
                sub_mata_anggaran_id: '',
                detail_mata_anggaran_id: '',
                uraian: '',
                volume: 1,
                satuan: 'unit',
                harga_satuan: 0,
                jumlah: 0,
            },
        ]);
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
    }, []);

    const updateItem = useCallback((itemId: string, field: keyof ItemRow, value: string | number) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;
                const updated = { ...item, [field]: value };
                if (field === 'mata_anggaran_id') {
                    updated.sub_mata_anggaran_id = '';
                    updated.detail_mata_anggaran_id = '';
                    // Set active to load sub options
                    if (value) setActiveMataAnggaranId(Number(value));
                }
                if (field === 'sub_mata_anggaran_id') {
                    updated.detail_mata_anggaran_id = '';
                    // Set active to load detail options
                    if (value) setActiveSubMataAnggaranId(Number(value));
                }
                if (field === 'volume' || field === 'harga_satuan') {
                    updated.jumlah = updated.volume * updated.harga_satuan;
                }
                return updated;
            }),
        );
    }, []);

    const runningTotal = items.reduce((sum, item) => sum + item.jumlah, 0);

    const canProceed = () => {
        if (currentStep === 1) return namaPengajuan.trim() !== '' && tempat.trim() !== '';
        if (currentStep === 2) return items.length > 0 && items.every((i) => i.jumlah > 0);
        return true;
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep((s) => s + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    // Build update DTO
    const buildUpdateDTO = (): UpdatePengajuanDTO => ({
        nama_pengajuan: namaPengajuan,
        tempat: tempat || undefined,
        waktu_kegiatan: waktuKegiatan || undefined,
        details: items.map(item => ({
            id: item.detail_pengajuan_id,
            mata_anggaran_id: item.mata_anggaran_id ? parseInt(item.mata_anggaran_id) : undefined,
            sub_mata_anggaran_id: item.sub_mata_anggaran_id ? parseInt(item.sub_mata_anggaran_id) : undefined,
            detail_mata_anggaran_id: item.detail_mata_anggaran_id ? parseInt(item.detail_mata_anggaran_id) : undefined,
            uraian: item.uraian || undefined,
            volume: item.volume,
            satuan: item.satuan,
            harga_satuan: item.harga_satuan,
            jumlah: item.jumlah,
        })),
    });

    const handleSave = async () => {
        if (!pengajuanId) return;

        try {
            await updateMutation.mutateAsync({ id: pengajuanId, dto: buildUpdateDTO() });

            // Upload new files
            for (const file of files) {
                await uploadMutation.mutateAsync({ pengajuanId, file });
            }

            toast.success('Pengajuan berhasil diperbarui');
            navigate(`/pengajuan/${pengajuanId}`);
        } catch (error) {
            toast.error('Gagal memperbarui pengajuan');
            console.error(error);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!pengajuanId) return;

        try {
            // First update the pengajuan
            await updateMutation.mutateAsync({ id: pengajuanId, dto: buildUpdateDTO() });

            // Upload new files
            for (const file of files) {
                await uploadMutation.mutateAsync({ pengajuanId, file });
            }

            // Then resubmit for approval
            await resubmitMutation.mutateAsync(pengajuanId);

            toast.success('Pengajuan berhasil diajukan kembali untuk persetujuan');
            navigate('/pengajuan');
        } catch (error) {
            toast.error('Gagal mengajukan kembali pengajuan');
            console.error(error);
        }
    };

    const isSubmitting = updateMutation.isPending || resubmitMutation.isPending || uploadMutation.isPending;

    // Existing files from pengajuan
    const existingFiles = useMemo(() => {
        if (!pengajuan?.attachments) return [];
        return pengajuan.attachments.map(a => ({
            name: a.nama,
            url: `/storage/${a.path}`,
        }));
    }, [pengajuan]);

    // ---------------------------------------------------------------------------
    // Loading & Error states
    // ---------------------------------------------------------------------------

    if (isLoadingPengajuan) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-slate-600">Memuat data pengajuan...</span>
                </div>
            </PageTransition>
        );
    }

    if (pengajuanError || !pengajuan) {
        return (
            <PageTransition>
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span>Gagal memuat data pengajuan. Silakan coba lagi.</span>
                    </div>
                    <button
                        onClick={() => navigate('/pengajuan')}
                        className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Kembali ke daftar
                    </button>
                </div>
            </PageTransition>
        );
    }

    // ---------------------------------------------------------------------------
    // Render step content
    // ---------------------------------------------------------------------------

    const renderStep1 = () => (
        <motion.div
            key="edit-step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nama Pengajuan / Perihal <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={namaPengajuan}
                    onChange={(e) => setNamaPengajuan(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                <input
                    type="text"
                    value={pengajuan.unit || user?.unit || '-'}
                    disabled
                    className="block w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 shadow-sm"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tempat Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Waktu Kegiatan</label>
                <input
                    type="date"
                    value={waktuKegiatan}
                    onChange={(e) => setWaktuKegiatan(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div
            key="edit-step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            {items.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Item #{index + 1}</h4>
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Mata Anggaran</label>
                            <SearchableSelect
                                options={mataAnggaranOptions}
                                value={item.mata_anggaran_id}
                                onChange={(val) => updateItem(item.id, 'mata_anggaran_id', val)}
                                placeholder="Pilih mata anggaran"
                                searchPlaceholder="Cari mata anggaran..."
                                isLoading={isLoadingMA}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Sub</label>
                            <SearchableSelect
                                options={subMataAnggaranOptions}
                                value={item.sub_mata_anggaran_id}
                                onChange={(val) => updateItem(item.id, 'sub_mata_anggaran_id', val)}
                                placeholder="Pilih sub"
                                searchPlaceholder="Cari sub..."
                                disabled={!item.mata_anggaran_id}
                                isLoading={isLoadingSMA && activeMataAnggaranId === Number(item.mata_anggaran_id)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Detail</label>
                            <SearchableSelect
                                options={detailMataAnggaranOptions}
                                value={item.detail_mata_anggaran_id}
                                onChange={(val) => updateItem(item.id, 'detail_mata_anggaran_id', val)}
                                placeholder="Pilih detail"
                                searchPlaceholder="Cari detail..."
                                disabled={!item.sub_mata_anggaran_id}
                                isLoading={isLoadingDMA && activeSubMataAnggaranId === Number(item.sub_mata_anggaran_id)}
                            />
                        </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <div>
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
                        <div>
                            <CurrencyInput
                                label="Harga Satuan"
                                value={item.harga_satuan}
                                onChange={(val) => updateItem(item.id, 'harga_satuan', val)}
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                        <p className="text-sm text-slate-600">
                            Jumlah: <span className="font-bold text-slate-900">{formatRupiah(item.jumlah)}</span>
                        </p>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addItem}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
            >
                <Plus className="h-4 w-4" />
                Tambah Item
            </button>

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
            key="edit-step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <div>
                <h3 className="mb-2 text-sm font-medium text-slate-700">Dokumen Pendukung</h3>
                <FileUpload
                    onFilesSelected={setFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                    multiple
                    maxSize={10}
                    existingFiles={existingFiles}
                />
            </div>
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div
            key="edit-step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="mb-4 text-base font-semibold text-slate-900">Ringkasan Pengajuan</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Perihal</p>
                        <p className="mt-0.5 text-sm text-slate-900">{namaPengajuan || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Unit</p>
                        <p className="mt-0.5 text-sm text-slate-900">{pengajuan.unit || user?.unit || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Tempat</p>
                        <p className="mt-0.5 text-sm text-slate-900">{tempat || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Waktu Kegiatan</p>
                        <p className="mt-0.5 text-sm text-slate-900">{waktuKegiatan || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-base font-semibold text-slate-900">Detail Item ({items.length})</h3>
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
                                <td colSpan={4} className="py-2 text-right text-sm font-semibold text-slate-700">Total</td>
                                <td className="py-2 text-right text-base font-bold text-blue-600">{formatRupiah(runningTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Edit Pengajuan Anggaran"
                        description={`Editing: ${namaPengajuan || pengajuan.nama_pengajuan}`}
                    />
                </motion.div>

                {/* Progress bar */}
                <motion.div variants={staggerItem} className="mb-6">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                            className="h-full rounded-full bg-blue-600"
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
                                        isActive ? 'bg-blue-50 text-blue-700' : isCompleted ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full',
                                            isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500',
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
                                onClick={currentStep === 1 ? () => navigate(`/pengajuan/${pengajuanId}`) : prevStep}
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
                                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            Simpan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitForApproval}
                                            disabled={isSubmitting}
                                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            Ajukan Kembali
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        </PageTransition>
    );
}
