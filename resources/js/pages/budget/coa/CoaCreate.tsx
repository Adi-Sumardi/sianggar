import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

import {
    useNoMataAnggarans,
    useCreateMataAnggaran,
    useCreateSubMataAnggaran,
    useCreateDetailMataAnggaran,
} from '@/hooks/useBudget';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';
import type {
    CreateMataAnggaranDTO,
    CreateSubMataAnggaranDTO,
    CreateDetailMataAnggaranDTO,
} from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubMataAnggaranForm {
    id: string; // temporary id for UI
    kode: string;
    nama: string;
    keterangan: string;
    isExpanded: boolean;
    details: DetailMataAnggaranForm[];
}

interface DetailMataAnggaranForm {
    id: string;
    kode: string;
    nama: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    keterangan: string;
}

interface FormData {
    unit_id: number | null;
    no_mata_anggaran_id: number | null;
    tahun: string;
    kode: string;
    nama: string;
    jenis: string;
    keterangan: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTahunAnggaranOptions() {
    return getAcademicYearOptions().map((ay) => ({
        value: ay,
        label: `TA ${ay}`,
    }));
}

function generateId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const jenisOptions = [
    { value: 'pendapatan', label: 'Pendapatan' },
    { value: 'belanja_pegawai', label: 'Belanja Pegawai' },
    { value: 'belanja_barang', label: 'Belanja Barang & Jasa' },
    { value: 'belanja_modal', label: 'Belanja Modal' },
    { value: 'belanja_lainnya', label: 'Belanja Lainnya' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoaCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state
    const [form, setForm] = useState<FormData>({
        unit_id: null,
        no_mata_anggaran_id: null,
        tahun: getCurrentAcademicYear(),
        kode: '',
        nama: '',
        jenis: '',
        keterangan: '',
    });

    // Sub Mata Anggaran list
    const [subMataAnggarans, setSubMataAnggarans] = useState<SubMataAnggaranForm[]>([]);

    // Set unit_id from current user on mount
    useEffect(() => {
        if (user?.unit_id) {
            setForm((prev) => ({ ...prev, unit_id: user.unit_id }));
        }
    }, [user?.unit_id]);

    // Queries
    const { data: noMataAnggaransData, isLoading: noMataAnggaransLoading } = useNoMataAnggarans();

    // Mutations
    const createMataAnggaran = useCreateMataAnggaran();
    const createSubMataAnggaran = useCreateSubMataAnggaran();
    const createDetailMataAnggaran = useCreateDetailMataAnggaran();

    // Derived data
    const noMataAnggaranOptions = useMemo(() => {
        return (
            noMataAnggaransData?.data?.map((nma) => ({
                value: nma.id.toString(),
                label: `${nma.no_mata_anggaran} - ${nma.mata_anggaran}`,
                description: nma.mata_anggaran,
            })) ?? []
        );
    }, [noMataAnggaransData]);

    const tahunOptions = useMemo(() => generateTahunAnggaranOptions(), []);

    // Auto-fill kode and nama when NoMataAnggaran is selected
    useEffect(() => {
        if (form.no_mata_anggaran_id) {
            const selected = noMataAnggaransData?.data?.find(
                (nma) => nma.id === form.no_mata_anggaran_id
            );
            if (selected) {
                setForm((prev) => ({
                    ...prev,
                    kode: selected.no_mata_anggaran,
                    nama: selected.mata_anggaran,
                }));
            }
        }
    }, [form.no_mata_anggaran_id, noMataAnggaransData]);

    // Handlers
    const handleAddSubMataAnggaran = () => {
        setSubMataAnggarans((prev) => [
            ...prev,
            {
                id: generateId(),
                kode: '',
                nama: '',
                keterangan: '',
                isExpanded: true,
                details: [],
            },
        ]);
    };

    const handleRemoveSubMataAnggaran = (id: string) => {
        setSubMataAnggarans((prev) => prev.filter((s) => s.id !== id));
    };

    const handleUpdateSubMataAnggaran = (
        id: string,
        field: keyof Omit<SubMataAnggaranForm, 'id' | 'details'>,
        value: string | boolean
    ) => {
        setSubMataAnggarans((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleToggleSubExpanded = (id: string) => {
        setSubMataAnggarans((prev) =>
            prev.map((s) => (s.id === id ? { ...s, isExpanded: !s.isExpanded } : s))
        );
    };

    const handleAddDetail = (subId: string) => {
        setSubMataAnggarans((prev) =>
            prev.map((s) =>
                s.id === subId
                    ? {
                          ...s,
                          details: [
                              ...s.details,
                              {
                                  id: generateId(),
                                  kode: '',
                                  nama: '',
                                  volume: 1,
                                  satuan: '',
                                  harga_satuan: 0,
                                  keterangan: '',
                              },
                          ],
                      }
                    : s
            )
        );
    };

    const handleRemoveDetail = (subId: string, detailId: string) => {
        setSubMataAnggarans((prev) =>
            prev.map((s) =>
                s.id === subId
                    ? { ...s, details: s.details.filter((d) => d.id !== detailId) }
                    : s
            )
        );
    };

    const handleUpdateDetail = (
        subId: string,
        detailId: string,
        field: keyof Omit<DetailMataAnggaranForm, 'id'>,
        value: string | number
    ) => {
        setSubMataAnggarans((prev) =>
            prev.map((s) =>
                s.id === subId
                    ? {
                          ...s,
                          details: s.details.map((d) =>
                              d.id === detailId ? { ...d, [field]: value } : d
                          ),
                      }
                    : s
            )
        );
    };

    const isMutating =
        createMataAnggaran.isPending ||
        createSubMataAnggaran.isPending ||
        createDetailMataAnggaran.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.unit_id) {
            toast.error('Unit tidak ditemukan');
            return;
        }
        if (!form.kode.trim()) {
            toast.error('Kode Mata Anggaran wajib diisi');
            return;
        }
        if (!form.nama.trim()) {
            toast.error('Nama Mata Anggaran wajib diisi');
            return;
        }

        try {
            // 1. Create Mata Anggaran
            const mataAnggaranDto: CreateMataAnggaranDTO = {
                unit_id: form.unit_id,
                no_mata_anggaran_id: form.no_mata_anggaran_id,
                kode: form.kode,
                nama: form.nama,
                tahun: form.tahun,
                jenis: form.jenis || null,
                keterangan: form.keterangan || null,
            };

            const createdMataAnggaran = await createMataAnggaran.mutateAsync(mataAnggaranDto);

            // 2. Create Sub Mata Anggarans
            for (const sub of subMataAnggarans) {
                if (!sub.kode.trim() || !sub.nama.trim()) continue;

                const subDto: CreateSubMataAnggaranDTO = {
                    mata_anggaran_id: createdMataAnggaran.id,
                    unit_id: form.unit_id,
                    kode: sub.kode,
                    nama: sub.nama,
                };

                const createdSub = await createSubMataAnggaran.mutateAsync(subDto);

                // 3. Create Detail Mata Anggarans for this sub
                for (const detail of sub.details) {
                    if (!detail.kode.trim() || !detail.nama.trim()) continue;

                    const detailDto: CreateDetailMataAnggaranDTO = {
                        mata_anggaran_id: createdMataAnggaran.id,
                        sub_mata_anggaran_id: createdSub.id,
                        unit_id: form.unit_id,
                        kode: detail.kode,
                        nama: detail.nama,
                        volume: detail.volume,
                        satuan: detail.satuan,
                        harga_satuan: detail.harga_satuan,
                        jumlah: detail.volume * detail.harga_satuan,
                        keterangan: detail.keterangan || undefined,
                    };

                    await createDetailMataAnggaran.mutateAsync(detailDto);
                }
            }

            toast.success('COA berhasil dibuat');
            navigate('/budget/coa');
        } catch (error) {
            console.error('Failed to create COA:', error);
            toast.error('Gagal membuat COA');
        }
    };

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Tambah Chart of Account"
                        description="Buat mata anggaran baru dengan sub dan detail"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/budget/coa')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                {/* Form */}
                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Unit Info */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Informasi Unit
                                </h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                        {user?.unit?.nama || 'Unit tidak ditemukan'}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tahun Anggaran <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={tahunOptions}
                                        value={form.tahun}
                                        onChange={(val) =>
                                            setForm((prev) => ({ ...prev, tahun: val }))
                                        }
                                        placeholder="Pilih Tahun Anggaran"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mata Anggaran */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                Mata Anggaran
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Referensi Master COA
                                    </label>
                                    <SearchableSelect
                                        options={noMataAnggaranOptions}
                                        value={form.no_mata_anggaran_id?.toString() || ''}
                                        onChange={(val) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                no_mata_anggaran_id: val ? parseInt(val) : null,
                                            }))
                                        }
                                        placeholder="Pilih Master COA (opsional)"
                                        isLoading={noMataAnggaransLoading}
                                        emptyMessage="Master COA tidak ditemukan"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Pilih Master COA untuk mengisi kode dan nama secara otomatis
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Kode <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.kode}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, kode: e.target.value }))
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Contoh: 5.1.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Jenis
                                        </label>
                                        <SearchableSelect
                                            options={jenisOptions}
                                            value={form.jenis}
                                            onChange={(val) =>
                                                setForm((prev) => ({ ...prev, jenis: val }))
                                            }
                                            placeholder="Pilih Jenis"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Nama <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.nama}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, nama: e.target.value }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Nama Mata Anggaran"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Keterangan
                                    </label>
                                    <textarea
                                        value={form.keterangan}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                keterangan: e.target.value,
                                            }))
                                        }
                                        rows={2}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Keterangan (opsional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sub Mata Anggaran */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Sub Mata Anggaran
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleAddSubMataAnggaran}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Sub
                                </button>
                            </div>

                            {subMataAnggarans.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                    <p className="text-sm text-slate-500">
                                        Belum ada sub mata anggaran. Klik tombol "Tambah Sub" untuk
                                        menambahkan.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {subMataAnggarans.map((sub, index) => (
                                        <div
                                            key={sub.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50"
                                        >
                                            {/* Sub Header */}
                                            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSubExpanded(sub.id)}
                                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                >
                                                    {sub.isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <span className="font-medium text-slate-700">
                                                        {sub.kode || 'Sub'} - {sub.nama || '(Belum diisi)'}
                                                    </span>
                                                </div>
                                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    {sub.details.length} detail
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSubMataAnggaran(sub.id)}
                                                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Sub Form */}
                                            {sub.isExpanded && (
                                                <div className="p-4">
                                                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                Kode Sub
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={sub.kode}
                                                                onChange={(e) =>
                                                                    handleUpdateSubMataAnggaran(
                                                                        sub.id,
                                                                        'kode',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                                placeholder="Contoh: 01"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                Nama Sub
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={sub.nama}
                                                                onChange={(e) =>
                                                                    handleUpdateSubMataAnggaran(
                                                                        sub.id,
                                                                        'nama',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                                placeholder="Nama Sub Mata Anggaran"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Detail Mata Anggaran */}
                                                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <h4 className="text-sm font-semibold text-slate-700">
                                                                Detail Mata Anggaran
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddDetail(sub.id)}
                                                                className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                Tambah Detail
                                                            </button>
                                                        </div>

                                                        {sub.details.length === 0 ? (
                                                            <p className="text-center text-xs text-slate-400">
                                                                Belum ada detail
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {sub.details.map((detail, dIndex) => (
                                                                    <div
                                                                        key={detail.id}
                                                                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                                                    >
                                                                        <div className="mb-2 flex items-center justify-between">
                                                                            <span className="text-xs font-medium text-slate-500">
                                                                                Detail #{dIndex + 1}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleRemoveDetail(
                                                                                        sub.id,
                                                                                        detail.id
                                                                                    )
                                                                                }
                                                                                className="rounded p-1 text-slate-400 hover:text-red-600"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                                            <div>
                                                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                                                    Kode
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={detail.kode}
                                                                                    onChange={(e) =>
                                                                                        handleUpdateDetail(
                                                                                            sub.id,
                                                                                            detail.id,
                                                                                            'kode',
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                                                                    placeholder="Kode"
                                                                                />
                                                                            </div>
                                                                            <div className="sm:col-span-2 lg:col-span-2">
                                                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                                                    Nama
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={detail.nama}
                                                                                    onChange={(e) =>
                                                                                        handleUpdateDetail(
                                                                                            sub.id,
                                                                                            detail.id,
                                                                                            'nama',
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                                                                    placeholder="Nama Detail"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                                                    Volume
                                                                                </label>
                                                                                <input
                                                                                    type="number"
                                                                                    value={detail.volume}
                                                                                    onChange={(e) =>
                                                                                        handleUpdateDetail(
                                                                                            sub.id,
                                                                                            detail.id,
                                                                                            'volume',
                                                                                            parseFloat(e.target.value) || 0
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                                                                    min={0}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                                                    Satuan
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={detail.satuan}
                                                                                    onChange={(e) =>
                                                                                        handleUpdateDetail(
                                                                                            sub.id,
                                                                                            detail.id,
                                                                                            'satuan',
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                                                                    placeholder="Satuan"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                                                    Harga Satuan
                                                                                </label>
                                                                                <CurrencyInput
                                                                                    value={detail.harga_satuan}
                                                                                    onChange={(val) =>
                                                                                        handleUpdateDetail(
                                                                                            sub.id,
                                                                                            detail.id,
                                                                                            'harga_satuan',
                                                                                            val
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/budget/coa')}
                                disabled={isMutating}
                                className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isMutating}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isMutating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan COA
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
