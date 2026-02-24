import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Building2, X } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchableSelect } from '@/components/common/SearchableSelect';

import {
    useCreateMataAnggaran,
    useCreateSubMataAnggaran,
    useJenisMataAnggarans,
    useCreateJenisMataAnggaran,
} from '@/hooks/useBudget';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/stores/authStore';
import type { CreateMataAnggaranDTO, CreateSubMataAnggaranDTO } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubMataAnggaranForm {
    id: string;
    kode: string;
    nama: string;
}

interface FormData {
    unit_id: number | null;
    kode: string;
    nama: string;
    tahun: string;
    jenis: string;
    keterangan: string;
}

interface NewJenisForm {
    kode: string;
    nama: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateTahunOptions() {
    return getAcademicYearOptions().map((ay) => ({
        value: ay,
        label: `TA ${ay}`,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MataAnggaranCreate() {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    // Form state
    const [form, setForm] = useState<FormData>({
        unit_id: null,
        kode: '',
        nama: '',
        tahun: getCurrentAcademicYear(),
        jenis: '',
        keterangan: '',
    });

    // Sub Mata Anggaran list
    const [subItems, setSubItems] = useState<SubMataAnggaranForm[]>([]);

    // Modal state for creating new jenis
    const [showJenisModal, setShowJenisModal] = useState(false);
    const [newJenisForm, setNewJenisForm] = useState<NewJenisForm>({ kode: '', nama: '' });

    // Set unit_id from current user on mount
    useEffect(() => {
        if (user?.unit_id) {
            setForm((prev) => ({ ...prev, unit_id: user.unit_id }));
        }
    }, [user?.unit_id]);

    // Queries
    const { data: jenisMataAnggaransData, isLoading: jenisLoading } = useJenisMataAnggarans();

    // Mutations
    const createMataAnggaran = useCreateMataAnggaran();
    const createSubMataAnggaran = useCreateSubMataAnggaran();
    const createJenisMataAnggaran = useCreateJenisMataAnggaran();

    // Derived data
    const jenisOptions = useMemo(() => {
        return (
            jenisMataAnggaransData?.data?.map((jenis) => ({
                value: jenis.kode,
                label: jenis.nama,
            })) ?? []
        );
    }, [jenisMataAnggaransData]);

    const tahunOptions = useMemo(() => generateTahunOptions(), []);

    // Handlers
    const handleAddSubItem = () => {
        setSubItems((prev) => [
            ...prev,
            { id: generateId(), kode: '', nama: '' },
        ]);
    };

    const handleRemoveSubItem = (id: string) => {
        setSubItems((prev) => prev.filter((s) => s.id !== id));
    };

    const handleUpdateSubItem = (id: string, field: keyof Omit<SubMataAnggaranForm, 'id'>, value: string) => {
        setSubItems((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleCreateJenis = async () => {
        if (!newJenisForm.kode.trim()) {
            toast.error('Kode jenis wajib diisi');
            return;
        }
        if (!newJenisForm.nama.trim()) {
            toast.error('Nama jenis wajib diisi');
            return;
        }

        try {
            const created = await createJenisMataAnggaran.mutateAsync({
                kode: newJenisForm.kode,
                nama: newJenisForm.nama,
            });
            toast.success('Jenis mata anggaran berhasil ditambahkan');
            setForm((prev) => ({ ...prev, jenis: created.kode }));
            setNewJenisForm({ kode: '', nama: '' });
            setShowJenisModal(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal membuat jenis mata anggaran';
            toast.error(errorMessage);
        }
    };

    const isMutating = createMataAnggaran.isPending || createSubMataAnggaran.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.unit_id) {
            toast.error('Unit tidak ditemukan. Silakan login ulang.');
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
        if (!form.tahun) {
            toast.error('Tahun Anggaran wajib dipilih');
            return;
        }

        try {
            // 1. Create Mata Anggaran
            const mataAnggaranDto: CreateMataAnggaranDTO = {
                unit_id: form.unit_id,
                kode: form.kode,
                nama: form.nama,
                tahun: form.tahun,
                jenis: form.jenis || null,
                keterangan: form.keterangan || null,
            };

            const createdMataAnggaran = await createMataAnggaran.mutateAsync(mataAnggaranDto);

            // 2. Create Sub Mata Anggarans
            for (const sub of subItems) {
                if (!sub.kode.trim() || !sub.nama.trim()) continue;

                const subDto: CreateSubMataAnggaranDTO = {
                    mata_anggaran_id: createdMataAnggaran.id,
                    unit_id: form.unit_id,
                    kode: sub.kode,
                    nama: sub.nama,
                };

                await createSubMataAnggaran.mutateAsync(subDto);
            }

            toast.success('Mata Anggaran berhasil ditambahkan');
            navigate('/budget/mata-anggaran');
        } catch (error) {
            console.error('Failed to create Mata Anggaran:', error);
            toast.error('Gagal menyimpan Mata Anggaran');
        }
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
                        title="Tambah Mata Anggaran"
                        description="Buat mata anggaran baru beserta sub mata anggarannya."
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/budget/mata-anggaran')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
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
                        {/* Unit Info Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Informasi Unit
                                </h2>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {/* Unit - dari user yang login */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                        {authLoading ? 'Memuat...' : (user?.unit?.nama ?? '-')}
                                    </div>
                                </div>

                                {/* Tahun */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Tahun Anggaran <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={tahunOptions}
                                        value={form.tahun}
                                        onChange={(val) => setForm((prev) => ({ ...prev, tahun: val }))}
                                        placeholder="Pilih Tahun Anggaran"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mata Anggaran Info Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-lg font-semibold text-slate-900">
                                Informasi Mata Anggaran
                            </h2>

                            <div className="space-y-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Kode */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="kode" className="block text-sm font-medium text-slate-700">
                                            Kode <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="kode"
                                            type="text"
                                            value={form.kode}
                                            onChange={(e) => setForm((prev) => ({ ...prev, kode: e.target.value }))}
                                            placeholder="Contoh: 5.1.01"
                                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    {/* Jenis */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-slate-700">
                                                Jenis
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowJenisModal(true)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Tambah Jenis
                                            </button>
                                        </div>
                                        <SearchableSelect
                                            options={jenisOptions}
                                            value={form.jenis}
                                            onChange={(val) => setForm((prev) => ({ ...prev, jenis: val }))}
                                            placeholder="Pilih Jenis"
                                            isLoading={jenisLoading}
                                            emptyMessage="Tidak ada jenis. Klik 'Tambah Jenis' untuk membuat baru."
                                        />
                                    </div>
                                </div>

                                {/* Nama */}
                                <div className="space-y-1.5">
                                    <label htmlFor="nama" className="block text-sm font-medium text-slate-700">
                                        Nama <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="nama"
                                        type="text"
                                        value={form.nama}
                                        onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                                        placeholder="Nama mata anggaran"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Keterangan */}
                                <div className="space-y-1.5">
                                    <label htmlFor="keterangan" className="block text-sm font-medium text-slate-700">
                                        Keterangan
                                    </label>
                                    <textarea
                                        id="keterangan"
                                        value={form.keterangan}
                                        onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                                        rows={2}
                                        placeholder="Keterangan (opsional)"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sub Mata Anggaran Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Sub Mata Anggaran
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Tambahkan sub mata anggaran (opsional).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddSubItem}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Sub
                                </button>
                            </div>

                            {subItems.length === 0 ? (
                                <div className="rounded-md border border-dashed border-slate-300 px-6 py-8 text-center">
                                    <p className="text-sm text-slate-500">
                                        Belum ada sub mata anggaran. Klik tombol di atas untuk menambahkan.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subItems.map((sub, index) => (
                                        <motion.div
                                            key={sub.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/50 p-4"
                                        >
                                            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                {index + 1}
                                            </span>

                                            <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                                {/* Sub Kode */}
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-slate-600">
                                                        Kode
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={sub.kode}
                                                        onChange={(e) => handleUpdateSubItem(sub.id, 'kode', e.target.value)}
                                                        placeholder="Contoh: 01"
                                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </div>

                                                {/* Sub Nama */}
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-slate-600">
                                                        Nama
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={sub.nama}
                                                        onChange={(e) => handleUpdateSubItem(sub.id, 'nama', e.target.value)}
                                                        placeholder="Nama sub mata anggaran"
                                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubItem(sub.id)}
                                                className="mt-6 shrink-0 rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                aria-label="Hapus sub item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/budget/mata-anggaran')}
                                disabled={isMutating}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isMutating}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            >
                                {isMutating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan Mata Anggaran
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>

            {/* Modal: Tambah Jenis Mata Anggaran */}
            {showJenisModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowJenisModal(false)}
                    />
                    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Tambah Jenis Mata Anggaran
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowJenisModal(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Kode <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newJenisForm.kode}
                                    onChange={(e) => setNewJenisForm((prev) => ({ ...prev, kode: e.target.value }))}
                                    placeholder="Contoh: belanja_operasional"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="text-xs text-slate-500">
                                    Gunakan huruf kecil dan underscore, tanpa spasi
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Nama <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newJenisForm.nama}
                                    onChange={(e) => setNewJenisForm((prev) => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Contoh: Belanja Operasional"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowJenisModal(false)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateJenis}
                                disabled={createJenisMataAnggaran.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createJenisMataAnggaran.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Simpan Jenis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
