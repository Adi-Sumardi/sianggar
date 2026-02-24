import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { getCurrentAcademicYear } from '@/stores/authStore';
import {
    useCreatePengajuan,
    useSubmitPengajuan,
    useUploadPengajuanAttachment,
} from '@/hooks/useProposals';
import { useDetailMataAnggarans } from '@/hooks/useBudget';
import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { BudgetInfoCard } from '@/components/common/BudgetInfoCard';
import { InsufficientBudgetModal } from '@/components/common/InsufficientBudgetModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { BudgetCheckResultItem, CreatePengajuanDTO } from '@/types/api';
import type { DetailMataAnggaran } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemRow {
    id: string;
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
// Step configs
// ---------------------------------------------------------------------------

const steps = [
    { id: 1, label: 'Informasi Dasar', icon: FileText },
    { id: 2, label: 'Detail Item', icon: ListChecks },
    { id: 3, label: 'Lampiran', icon: Paperclip },
    { id: 4, label: 'Review', icon: ClipboardCheck },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PengajuanCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentYear = getCurrentAcademicYear();

    // Fetch detail mata anggarans for user's unit
    const { data: detailMataAnggaransData, isLoading: isLoadingBudget } = useDetailMataAnggarans({
        unit_id: user?.unit_id ?? undefined,
        tahun: currentYear,
        per_page: 500, // Get all items
    });

    const detailMataAnggarans = detailMataAnggaransData?.data ?? [];

    // Build cascading options from detail mata anggarans
    const budgetOptions = useMemo(() => {
        const mataAnggaranMap = new Map<number, { id: number; kode: string; nama: string }>();
        const subMataAnggaranMap = new Map<number, Map<number, { id: number; kode: string; nama: string }>>();
        const detailMap = new Map<number, DetailMataAnggaran[]>();

        for (const detail of detailMataAnggarans) {
            // Build mata anggaran options
            if (detail.mata_anggaran_id && detail.mata_anggaran) {
                mataAnggaranMap.set(detail.mata_anggaran_id, {
                    id: detail.mata_anggaran_id,
                    kode: detail.mata_anggaran.kode,
                    nama: detail.mata_anggaran.nama,
                });
            }

            // Build sub mata anggaran options grouped by mata anggaran
            if (detail.mata_anggaran_id && detail.sub_mata_anggaran_id && detail.sub_mata_anggaran) {
                if (!subMataAnggaranMap.has(detail.mata_anggaran_id)) {
                    subMataAnggaranMap.set(detail.mata_anggaran_id, new Map());
                }
                subMataAnggaranMap.get(detail.mata_anggaran_id)!.set(detail.sub_mata_anggaran_id, {
                    id: detail.sub_mata_anggaran_id,
                    kode: detail.sub_mata_anggaran.kode,
                    nama: detail.sub_mata_anggaran.nama,
                });
            }

            // Build detail options grouped by sub mata anggaran
            const subId = detail.sub_mata_anggaran_id ?? 0;
            if (!detailMap.has(subId)) {
                detailMap.set(subId, []);
            }
            detailMap.get(subId)!.push(detail);
        }

        return {
            mataAnggarans: Array.from(mataAnggaranMap.values()),
            subMataAnggarans: subMataAnggaranMap,
            details: detailMap,
            allDetails: detailMataAnggarans,
        };
    }, [detailMataAnggarans]);

    // Mutations
    const createPengajuan = useCreatePengajuan();
    const submitPengajuan = useSubmitPengajuan();
    const uploadAttachment = useUploadPengajuanAttachment();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1 fields
    const [noSurat, setNoSurat] = useState('');
    const [namaPengajuan, setNamaPengajuan] = useState('');
    const [tempat, setTempat] = useState('');
    const [waktuKegiatan, setWaktuKegiatan] = useState('');
    const unitName = user?.unit?.nama ?? '-';

    // Step 2 items
    const [items, setItems] = useState<ItemRow[]>([
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

    // Step 3 files
    const [files, setFiles] = useState<File[]>([]);

    // Budget validation modal
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [insufficientItems, setInsufficientItems] = useState<BudgetCheckResultItem[]>([]);

    // ---------------------------------------------------------------------------
    // Budget helpers
    // ---------------------------------------------------------------------------

    const getDetailById = useCallback((detailId: string): DetailMataAnggaran | null => {
        if (!detailId) return null;
        const id = parseInt(detailId);
        return budgetOptions.allDetails.find(d => d.id === id) ?? null;
    }, [budgetOptions.allDetails]);

    const getSubOptionsForMataAnggaran = useCallback((mataAnggaranId: string) => {
        if (!mataAnggaranId) return [];
        const subMap = budgetOptions.subMataAnggarans.get(parseInt(mataAnggaranId));
        return subMap ? Array.from(subMap.values()) : [];
    }, [budgetOptions.subMataAnggarans]);

    const getDetailOptionsForSubMataAnggaran = useCallback((subMataAnggaranId: string) => {
        if (!subMataAnggaranId) return [];
        return budgetOptions.details.get(parseInt(subMataAnggaranId)) ?? [];
    }, [budgetOptions.details]);

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

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateItem = useCallback((id: string, field: keyof ItemRow, value: string | number) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const updated = { ...item, [field]: value };

                // Reset dependent fields
                if (field === 'mata_anggaran_id') {
                    updated.sub_mata_anggaran_id = '';
                    updated.detail_mata_anggaran_id = '';
                }
                if (field === 'sub_mata_anggaran_id') {
                    updated.detail_mata_anggaran_id = '';
                }

                // Recalculate jumlah
                if (field === 'volume' || field === 'harga_satuan') {
                    updated.jumlah = updated.volume * updated.harga_satuan;
                }

                return updated;
            }),
        );
    }, []);

    const runningTotal = items.reduce((sum, item) => sum + item.jumlah, 0);

    // ---------------------------------------------------------------------------
    // Navigation
    // ---------------------------------------------------------------------------

    const canProceed = () => {
        if (currentStep === 1) return noSurat.trim() !== '' && namaPengajuan.trim() !== '' && tempat.trim() !== '' && waktuKegiatan.trim() !== '';
        if (currentStep === 2) return items.length > 0 && items.every((i) => i.jumlah > 0 && i.detail_mata_anggaran_id !== '');
        if (currentStep === 3) return files.length > 0;
        return true;
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep((s) => s + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    // Build DTO for API
    const buildPengajuanDTO = (): CreatePengajuanDTO => {
        return {
            no_surat: noSurat,
            nama_pengajuan: namaPengajuan,
            tahun: currentYear,
            tempat: tempat || undefined,
            waktu_kegiatan: waktuKegiatan || undefined,
            details: items
                .filter((item) => item.jumlah > 0 && item.detail_mata_anggaran_id)
                .map((item) => ({
                    detail_mata_anggaran_id: parseInt(item.detail_mata_anggaran_id),
                    mata_anggaran_id: item.mata_anggaran_id ? parseInt(item.mata_anggaran_id) : null,
                    sub_mata_anggaran_id: item.sub_mata_anggaran_id ? parseInt(item.sub_mata_anggaran_id) : null,
                    nama_item: item.uraian || undefined,
                    jumlah: item.jumlah,
                })),
        };
    };

    const handleSubmitDraft = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const dto = buildPengajuanDTO();
            const created = await createPengajuan.mutateAsync(dto);

            // Upload attachments if any
            if (files.length > 0) {
                for (const file of files) {
                    await uploadAttachment.mutateAsync({ pengajuanId: created.id, file });
                }
            }

            toast.success('Pengajuan berhasil disimpan sebagai draft');
            navigate('/pengajuan');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan pengajuan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (isSubmitting) return;

        // Check budget sufficiency first
        const insufficient = checkBudgetSufficiency();
        if (insufficient.length > 0) {
            setInsufficientItems(insufficient);
            setShowBudgetModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const dto = buildPengajuanDTO();
            const created = await createPengajuan.mutateAsync(dto);

            // Upload attachments if any
            if (files.length > 0) {
                for (const file of files) {
                    await uploadAttachment.mutateAsync({ pengajuanId: created.id, file });
                }
            }

            // Submit for approval
            await submitPengajuan.mutateAsync(created.id);

            toast.success('Pengajuan berhasil diajukan untuk persetujuan');
            navigate('/pengajuan');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengajukan pengajuan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContactFinance = () => {
        // Open WhatsApp or show contact info
        window.open('https://wa.me/6281234567890?text=Halo Tim Keuangan, saya ingin konsultasi mengenai pengajuan anggaran.', '_blank');
        setShowBudgetModal(false);
    };

    // Check budget sufficiency before submit
    const checkBudgetSufficiency = useCallback(() => {
        const insufficient: BudgetCheckResultItem[] = [];

        for (const item of items) {
            if (!item.detail_mata_anggaran_id) continue;

            const budget = getDetailById(item.detail_mata_anggaran_id);
            if (!budget) continue;

            const saldoTersedia = budget.saldo_tersedia ?? (budget.anggaran_awal - budget.saldo_dipakai);
            if (item.jumlah > saldoTersedia) {
                insufficient.push({
                    detail_mata_anggaran_id: budget.id,
                    kode: budget.kode,
                    nama: budget.nama,
                    anggaran_awal: budget.anggaran_awal,
                    saldo_dipakai: budget.saldo_dipakai,
                    saldo_tersedia: saldoTersedia,
                    jumlah_diminta: item.jumlah,
                    is_sufficient: false,
                    kekurangan: item.jumlah - saldoTersedia,
                });
            }
        }

        return insufficient;
    }, [items, getDetailById]);

    const renderStep1 = () => (
        <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nomor Surat <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={noSurat}
                    onChange={(e) => setNoSurat(e.target.value)}
                    placeholder="Contoh: 001/PA/II/2026"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nama Pengajuan / Perihal <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={namaPengajuan}
                    onChange={(e) => setNamaPengajuan(e.target.value)}
                    placeholder="Contoh: Pengadaan Buku Pelajaran Semester Genap"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unit
                </label>
                <input
                    type="text"
                    value={unitName}
                    disabled
                    className="block w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 shadow-sm"
                />
                <p className="mt-1 text-xs text-slate-400">
                    Unit diambil otomatis dari akun Anda
                </p>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tempat Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    placeholder="Contoh: Aula Utama Kampus"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Waktu Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={waktuKegiatan}
                    onChange={(e) => setWaktuKegiatan(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
        </motion.div>
    );

    const renderStep2 = () => {
        if (isLoadingBudget) {
            return (
                <motion.div
                    key="step-2-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-48 items-center justify-center"
                >
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-600">Memuat data anggaran...</span>
                </motion.div>
            );
        }

        if (budgetOptions.mataAnggarans.length === 0) {
            return (
                <motion.div
                    key="step-2-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-48 flex-col items-center justify-center text-center"
                >
                    <p className="text-sm text-slate-600">Tidak ada data anggaran untuk unit Anda.</p>
                    <p className="mt-1 text-xs text-slate-400">Silakan hubungi Tim Keuangan untuk menambahkan data anggaran.</p>
                </motion.div>
            );
        }

        return (
            <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
            >
                {items.map((item, index) => {
                    const subOptions = getSubOptionsForMataAnggaran(item.mata_anggaran_id);
                    const detailOptions = getDetailOptionsForSubMataAnggaran(item.sub_mata_anggaran_id);
                    const budgetInfo = getDetailById(item.detail_mata_anggaran_id);
                    const saldoTersedia = budgetInfo
                        ? (budgetInfo.saldo_tersedia ?? (budgetInfo.anggaran_awal - budgetInfo.saldo_dipakai))
                        : 0;
                    const isBudgetInsufficient = budgetInfo && item.jumlah > saldoTersedia;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                                'rounded-lg border bg-white p-4',
                                isBudgetInsufficient
                                    ? 'border-red-300 ring-1 ring-red-200'
                                    : 'border-slate-200'
                            )}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Item #{index + 1}
                                </h4>
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
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Mata Anggaran
                                    </label>
                                    <SearchableSelect
                                        options={budgetOptions.mataAnggarans.map((opt) => ({
                                            value: opt.id.toString(),
                                            label: `${opt.kode} - ${opt.nama}`,
                                        }))}
                                        value={item.mata_anggaran_id}
                                        onChange={(val) => updateItem(item.id, 'mata_anggaran_id', val)}
                                        placeholder="Pilih mata anggaran"
                                        searchPlaceholder="Cari kode atau nama..."
                                        emptyMessage="Tidak ditemukan"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Sub Mata Anggaran
                                    </label>
                                    <SearchableSelect
                                        options={subOptions.map((opt) => ({
                                            value: opt.id.toString(),
                                            label: `${opt.kode} - ${opt.nama}`,
                                        }))}
                                        value={item.sub_mata_anggaran_id}
                                        onChange={(val) => updateItem(item.id, 'sub_mata_anggaran_id', val)}
                                        placeholder="Pilih sub"
                                        searchPlaceholder="Cari kode atau nama..."
                                        emptyMessage="Tidak ditemukan"
                                        disabled={subOptions.length === 0}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Detail
                                    </label>
                                    <SearchableSelect
                                        options={detailOptions.map((opt) => ({
                                            value: opt.id.toString(),
                                            label: `${opt.kode} - ${opt.nama}`,
                                            description: `Saldo: ${formatRupiah(opt.saldo_tersedia ?? (opt.anggaran_awal - opt.saldo_dipakai))}`,
                                        }))}
                                        value={item.detail_mata_anggaran_id}
                                        onChange={(val) => updateItem(item.id, 'detail_mata_anggaran_id', val)}
                                        placeholder="Pilih detail"
                                        searchPlaceholder="Cari kode atau nama..."
                                        emptyMessage="Tidak ditemukan"
                                        disabled={detailOptions.length === 0}
                                    />
                                    {budgetInfo && (
                                        <p className={cn(
                                            'mt-1 text-xs',
                                            isBudgetInsufficient ? 'text-red-500' : 'text-slate-400'
                                        )}>
                                            Sisa saldo:{' '}
                                            <span className={cn(
                                                'font-medium',
                                                isBudgetInsufficient ? 'text-red-600' : 'text-emerald-600'
                                            )}>
                                                {formatRupiah(saldoTersedia)}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Uraian
                                    </label>
                                    <input
                                        type="text"
                                        value={item.uraian}
                                        onChange={(e) => updateItem(item.id, 'uraian', e.target.value)}
                                        placeholder="Deskripsi item"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Volume
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.volume}
                                        onChange={(e) =>
                                            updateItem(item.id, 'volume', parseInt(e.target.value) || 0)
                                        }
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Satuan
                                    </label>
                                    <input
                                        type="text"
                                        value={item.satuan}
                                        onChange={(e) => updateItem(item.id, 'satuan', e.target.value)}
                                        placeholder="unit, pcs, dll"
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

                            <div className="mt-3 flex items-center justify-between">
                                {budgetInfo && item.jumlah > 0 && (
                                    <BudgetInfoCard
                                        nama={budgetInfo.nama}
                                        kode={budgetInfo.kode}
                                        anggaranAwal={budgetInfo.anggaran_awal}
                                        saldoDigunakan={budgetInfo.saldo_dipakai}
                                        saldoTersedia={saldoTersedia}
                                        jumlahDiminta={item.jumlah}
                                        compact
                                        className="flex-1 mr-4"
                                    />
                                )}
                                <p className="text-sm text-slate-600">
                                    Jumlah: <span className={cn(
                                        'font-bold',
                                        isBudgetInsufficient ? 'text-red-600' : 'text-slate-900'
                                    )}>
                                        {formatRupiah(item.jumlah)}
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    );
                })}

                <button
                    type="button"
                    onClick={addItem}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Item
                </button>

                {/* Running total */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Total Pengajuan</span>
                        <span className="text-xl font-bold text-blue-700">{formatRupiah(runningTotal)}</span>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderStep3 = () => (
        <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            <div>
                <h3 className="mb-2 text-sm font-medium text-slate-700">
                    Dokumen Pendukung <span className="text-red-500">*</span>
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                    Upload dokumen pendukung seperti RAB, proposal kegiatan, atau dokumen lainnya. Minimal 1 file wajib diupload.
                </p>
                <FileUpload
                    onFilesSelected={setFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                    multiple
                    maxSize={10}
                />
                {files.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                        Belum ada file yang diupload. Minimal 1 file lampiran wajib diupload.
                    </p>
                )}
            </div>
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            {/* Summary card */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="mb-4 text-base font-semibold text-slate-900">Ringkasan Pengajuan</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Nomor Surat</p>
                        <p className="mt-0.5 text-sm text-slate-900">{noSurat || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Perihal</p>
                        <p className="mt-0.5 text-sm text-slate-900">{namaPengajuan || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Unit</p>
                        <p className="mt-0.5 text-sm text-slate-900">{unitName}</p>
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

            {/* Items summary */}
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
                            {items.map((item, index) => {
                                const detail = getDetailById(item.detail_mata_anggaran_id);
                                return (
                                    <tr key={item.id}>
                                        <td className="py-2 pr-4 text-slate-500">{index + 1}</td>
                                        <td className="py-2 pr-4 text-slate-700">
                                            {item.uraian || detail?.nama || '-'}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-700">{item.volume}</td>
                                        <td className="py-2 pr-4 text-slate-700">{item.satuan}</td>
                                        <td className="py-2 text-right font-medium text-slate-900">
                                            {formatRupiah(item.jumlah)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200">
                                <td colSpan={4} className="py-2 text-right text-sm font-semibold text-slate-700">
                                    Total
                                </td>
                                <td className="py-2 text-right text-base font-bold text-blue-600">
                                    {formatRupiah(runningTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Attachments summary */}
            {files.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="mb-2 text-base font-semibold text-slate-900">
                        Lampiran ({files.length})
                    </h3>
                    <ul className="space-y-1">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                                {file.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Buat Pengajuan Anggaran"
                        description="Isi formulir untuk membuat pengajuan anggaran baru"
                    />
                </motion.div>

                {/* Progress bar */}
                <motion.div variants={staggerItem} className="mb-6">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                            className="h-full rounded-full bg-blue-600"
                            initial={{ width: '25%' }}
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
                                        isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : isCompleted
                                              ? 'text-emerald-600 hover:bg-emerald-50'
                                              : 'text-slate-400',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full',
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : isCompleted
                                                  ? 'bg-emerald-500 text-white'
                                                  : 'bg-slate-200 text-slate-500',
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <StepIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span className="hidden sm:inline">{step.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Step content */}
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

                        {/* Navigation buttons */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={currentStep === 1 ? () => navigate('/pengajuan') : prevStep}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {currentStep === 1 ? 'Batal' : 'Sebelumnya'}
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                                {currentStep === 4 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSubmitDraft}
                                            disabled={isSubmitting}
                                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitForApproval}
                                            disabled={isSubmitting}
                                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" />
                                            {isSubmitting ? 'Mengajukan...' : 'Ajukan Persetujuan'}
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
