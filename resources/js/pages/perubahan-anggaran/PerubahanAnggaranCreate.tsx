import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2, Loader2, Send, Save, AlertTriangle, ArrowRightLeft, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { FileUpload } from '@/components/common/FileUpload';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { useDetailMataAnggarans } from '@/hooks/useBudget';
import {
    useCreatePerubahanAnggaran,
    useSubmitPerubahanAnggaran,
    useUploadPerubahanAnggaranAttachment,
} from '@/hooks/usePerubahanAnggaran';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentAcademicYear } from '@/stores/authStore';
import type { DetailMataAnggaran } from '@/types/models';
import type { CreatePerubahanAnggaranDTO, PerubahanAnggaranItemDTO } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PerubahanType = 'geser' | 'tambah';

interface FormValues {
    perihal: string;
    alasan: string;
    items: {
        type: PerubahanType;
        source_detail_mata_anggaran_id: number | null;
        target_detail_mata_anggaran_id: number | null;
        amount: number;
        keterangan: string;
    }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerubahanAnggaranCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentYear = getCurrentAcademicYear();
    const [submitAfterCreate, setSubmitAfterCreate] = useState(false);

    // Fetch budget data
    const { data: detailMataAnggaransData, isLoading: isLoadingBudget } = useDetailMataAnggarans({
        unit_id: user?.unit_id ?? undefined,
        tahun: currentYear,
        per_page: 500,
    });

    const detailMataAnggarans = useMemo(
        () => (detailMataAnggaransData?.data || []) as DetailMataAnggaran[],
        [detailMataAnggaransData],
    );

    // Mutations
    const createMutation = useCreatePerubahanAnggaran();
    const submitMutation = useSubmitPerubahanAnggaran();
    const uploadAttachmentMutation = useUploadPerubahanAnggaranAttachment();

    // File state
    const [files, setFiles] = useState<File[]>([]);

    // Form
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            perihal: '',
            alasan: '',
            items: [
                {
                    type: 'geser',
                    source_detail_mata_anggaran_id: null,
                    target_detail_mata_anggaran_id: null,
                    amount: 0,
                    keterangan: '',
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    // Use useWatch for reactive updates on array fields
    const watchItems = useWatch({
        control,
        name: 'items',
        defaultValue: [],
    });

    // Calculate total - no useMemo needed as useWatch triggers re-render
    const totalAmount = (watchItems || []).reduce(
        (sum, item) => sum + (Number(item?.amount) || 0),
        0
    );

    // Budget options for searchable select
    const budgetOptions = useMemo(() => {
        return detailMataAnggarans.map((d) => ({
            value: String(d.id),
            label: `${d.kode} - ${d.nama}`,
            description: `Saldo: ${formatRupiah(d.saldo_tersedia || 0)}`,
            balance: d.saldo_tersedia || 0,
        }));
    }, [detailMataAnggarans]);

    // Submit handler
    const onSubmit = async (data: FormValues) => {
        try {
            // Validate items - for 'geser' need source & target, for 'tambah' only target
            const validItems: PerubahanAnggaranItemDTO[] = data.items
                .filter((item) => {
                    const itemType = item.type || 'geser';
                    if (itemType === 'geser') {
                        return item.source_detail_mata_anggaran_id && item.target_detail_mata_anggaran_id && item.amount > 0;
                    }
                    // For 'tambah', only target is required
                    return item.target_detail_mata_anggaran_id && item.amount > 0;
                })
                .map((item) => {
                    const itemType = item.type || 'geser';
                    return {
                        type: itemType,
                        source_detail_mata_anggaran_id: itemType === 'geser' ? item.source_detail_mata_anggaran_id! : null,
                        target_detail_mata_anggaran_id: item.target_detail_mata_anggaran_id!,
                        amount: Number(item.amount),
                        keterangan: item.keterangan || undefined,
                    };
                });

            if (validItems.length === 0) {
                toast.error('Minimal harus ada 1 item transfer yang valid');
                return;
            }

            const dto: CreatePerubahanAnggaranDTO = {
                perihal: data.perihal,
                alasan: data.alasan,
                tahun: currentYear,
                items: validItems,
            };

            const created = await createMutation.mutateAsync(dto);

            // Upload attachments if any
            if (files.length > 0) {
                for (const file of files) {
                    await uploadAttachmentMutation.mutateAsync({
                        perubahanAnggaranId: created.id,
                        file,
                    });
                }
            }

            toast.success('Perubahan anggaran berhasil dibuat');

            if (submitAfterCreate) {
                await submitMutation.mutateAsync(created.id);
                toast.success('Perubahan anggaran berhasil diajukan');
            }

            navigate('/perubahan-anggaran');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan perubahan anggaran');
        }
    };

    // Get balance for a selected budget
    const getBalance = (budgetId: number | null) => {
        if (!budgetId) return 0;
        const budget = detailMataAnggarans.find((d) => d.id === budgetId);
        return budget?.saldo_tersedia || 0;
    };

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
                        title="Buat Perubahan Anggaran"
                        description="Ajukan permohonan geser anggaran atau tambah anggaran"
                        backButton={
                            <button
                                onClick={() => navigate('/perubahan-anggaran')}
                                className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        }
                    />
                </motion.div>

                {/* Form */}
                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                Informasi Umum
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Perihal <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('perihal', { required: 'Perihal wajib diisi' })}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Perihal perubahan anggaran"
                                    />
                                    {errors.perihal && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.perihal.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Alasan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('alasan', { required: 'Alasan wajib diisi' })}
                                        rows={3}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Jelaskan alasan perubahan anggaran"
                                    />
                                    {errors.alasan && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.alasan.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Item Perubahan
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        append({
                                            type: 'geser',
                                            source_detail_mata_anggaran_id: null,
                                            target_detail_mata_anggaran_id: null,
                                            amount: 0,
                                            keterangan: '',
                                        })
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Item
                                </button>
                            </div>

                            {isLoadingBudget ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    <span className="ml-2 text-slate-600">Memuat data anggaran...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fields.map((field, index) => {
                                        const itemType = watchItems[index]?.type || 'geser';
                                        const sourceId = watchItems[index]?.source_detail_mata_anggaran_id;
                                        const sourceBalance = getBalance(sourceId);
                                        const amount = Number(watchItems[index]?.amount) || 0;
                                        const isInsufficient = itemType === 'geser' && sourceId && amount > sourceBalance;

                                        return (
                                            <div
                                                key={field.id}
                                                className={cn(
                                                    'rounded-lg border p-4',
                                                    itemType === 'geser'
                                                        ? 'border-blue-200 bg-blue-50/30'
                                                        : 'border-green-200 bg-green-50/30'
                                                )}
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Item #{index + 1}
                                                    </span>
                                                    {fields.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Type Selector */}
                                                <div className="mb-4">
                                                    {/* Hidden input to register type field */}
                                                    <input
                                                        type="hidden"
                                                        {...register(`items.${index}.type`)}
                                                    />
                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                        Jenis Perubahan
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setValue(`items.${index}.type`, 'geser');
                                                                setValue(`items.${index}.source_detail_mata_anggaran_id`, null);
                                                            }}
                                                            className={cn(
                                                                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                                                                itemType === 'geser'
                                                                    ? 'border-blue-500 bg-blue-100 text-blue-700 ring-1 ring-blue-500'
                                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                            )}
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                            Geser Anggaran
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setValue(`items.${index}.type`, 'tambah');
                                                                setValue(`items.${index}.source_detail_mata_anggaran_id`, null);
                                                            }}
                                                            className={cn(
                                                                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                                                                itemType === 'tambah'
                                                                    ? 'border-green-500 bg-green-100 text-green-700 ring-1 ring-green-500'
                                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                            )}
                                                        >
                                                            <PlusCircle className="h-4 w-4" />
                                                            Tambah Anggaran
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Budget Selection */}
                                                <div className="space-y-4">
                                                    {/* Source - Only show for 'geser' type */}
                                                    {itemType === 'geser' && (
                                                        <div>
                                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                Dari Anggaran <span className="text-red-500">*</span>
                                                            </label>
                                                            <Controller
                                                                name={`items.${index}.source_detail_mata_anggaran_id`}
                                                                control={control}
                                                                rules={{ required: itemType === 'geser' }}
                                                                render={({ field }) => (
                                                                    <SearchableSelect
                                                                        options={budgetOptions}
                                                                        value={field.value ? String(field.value) : ''}
                                                                        onChange={(val) =>
                                                                            field.onChange(val ? Number(val) : null)
                                                                        }
                                                                        placeholder="Pilih anggaran asal"
                                                                        searchPlaceholder="Cari kode atau nama anggaran..."
                                                                        emptyMessage="Anggaran tidak ditemukan"
                                                                        isLoading={isLoadingBudget}
                                                                    />
                                                                )}
                                                            />
                                                            {sourceId && (
                                                                <p className="mt-1.5 text-xs text-slate-500">
                                                                    Saldo tersedia:{' '}
                                                                    <span className="font-medium text-emerald-600">
                                                                        {formatRupiah(sourceBalance)}
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Target */}
                                                    <div>
                                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                            {itemType === 'geser' ? 'Ke Anggaran' : 'Anggaran Tujuan'}{' '}
                                                            <span className="text-red-500">*</span>
                                                        </label>
                                                        <Controller
                                                            name={`items.${index}.target_detail_mata_anggaran_id`}
                                                            control={control}
                                                            rules={{ required: true }}
                                                            render={({ field }) => (
                                                                <SearchableSelect
                                                                    options={budgetOptions.filter(
                                                                        (opt) => opt.value !== String(sourceId)
                                                                    )}
                                                                    value={field.value ? String(field.value) : ''}
                                                                    onChange={(val) =>
                                                                        field.onChange(val ? Number(val) : null)
                                                                    }
                                                                    placeholder={itemType === 'geser' ? 'Pilih anggaran tujuan' : 'Pilih anggaran yang akan ditambah'}
                                                                    searchPlaceholder="Cari kode atau nama anggaran..."
                                                                    emptyMessage="Anggaran tidak ditemukan"
                                                                    isLoading={isLoadingBudget}
                                                                />
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Amount & Keterangan */}
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <Controller
                                                                name={`items.${index}.amount`}
                                                                control={control}
                                                                rules={{ required: true, min: 1 }}
                                                                render={({ field }) => (
                                                                    <CurrencyInput
                                                                        label={
                                                                            <>
                                                                                Nominal <span className="text-red-500">*</span>
                                                                            </>
                                                                        }
                                                                        value={field.value || 0}
                                                                        onChange={field.onChange}
                                                                        placeholder="Masukkan nominal"
                                                                        error={isInsufficient ? 'Saldo tidak mencukupi' : undefined}
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                Keterangan
                                                            </label>
                                                            <input
                                                                type="text"
                                                                {...register(`items.${index}.keterangan`)}
                                                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                placeholder="Keterangan (opsional)"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Total */}
                            <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-4">
                                <div className="text-right">
                                    <p className="text-sm text-slate-600">Total Perubahan</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatRupiah(totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dokumen Pendukung (Opsional) */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                Dokumen Pendukung
                                <span className="ml-2 text-sm font-normal text-slate-500">(Opsional)</span>
                            </h3>
                            <p className="mb-4 text-sm text-slate-600">
                                Upload dokumen pendukung dalam format PDF (maks. 10MB per file).
                            </p>
                            <FileUpload
                                onFilesSelected={setFiles}
                                accept=".pdf"
                                multiple
                                maxSize={10}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/perubahan-anggaran')}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                onClick={() => setSubmitAfterCreate(false)}
                                disabled={isSubmitting || createMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createMutation.isPending && !submitAfterCreate ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Simpan Draft
                            </button>
                            <button
                                type="submit"
                                onClick={() => setSubmitAfterCreate(true)}
                                disabled={isSubmitting || createMutation.isPending || submitMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {(createMutation.isPending || submitMutation.isPending) &&
                                submitAfterCreate ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Simpan & Ajukan
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
