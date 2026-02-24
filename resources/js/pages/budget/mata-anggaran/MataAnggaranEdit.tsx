import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Loader2,
    Building2,
    X,
    ChevronDown,
    ChevronRight,
    Pencil,
    Check,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '@/lib/animations';
import { formatRupiah } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CurrencyInput } from '@/components/common/CurrencyInput';

import {
    useNoMataAnggarans,
    useMataAnggaran,
    useUpdateMataAnggaran,
    useJenisMataAnggarans,
    useCreateJenisMataAnggaran,
    useSubMataAnggarans,
    useCreateSubMataAnggaran,
    useUpdateSubMataAnggaran,
    useDeleteSubMataAnggaran,
    useDetailMataAnggarans,
    useCreateDetailMataAnggaran,
    useUpdateDetailMataAnggaran,
    useDeleteDetailMataAnggaran,
} from '@/hooks/useBudget';
import type {
    UpdateMataAnggaranDTO,
    CreateSubMataAnggaranDTO,
    UpdateSubMataAnggaranDTO,
    CreateDetailMataAnggaranDTO,
    UpdateDetailMataAnggaranDTO,
} from '@/types/api';
import type { SubMataAnggaran, DetailMataAnggaran } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
    no_mata_anggaran_id: number | null;
    kode: string;
    nama: string;
    jenis: string;
    keterangan: string;
}

interface NewJenisForm {
    kode: string;
    nama: string;
}

interface NewSubForm {
    kode: string;
    nama: string;
}

interface NewDetailForm {
    kode: string;
    nama: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    keterangan: string;
}

interface EditingSubState {
    id: number;
    kode: string;
    nama: string;
}

interface EditingDetailState {
    id: number;
    kode: string;
    nama: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    keterangan: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MataAnggaranEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const mataAnggaranId = id ? parseInt(id) : null;

    // Fetch existing data
    const { data: mataAnggaran, isLoading: isLoadingMa, isError } = useMataAnggaran(mataAnggaranId);

    // Form state
    const [form, setForm] = useState<FormData>({
        no_mata_anggaran_id: null,
        kode: '',
        nama: '',
        jenis: '',
        keterangan: '',
    });

    // Modal state for creating new jenis
    const [showJenisModal, setShowJenisModal] = useState(false);
    const [newJenisForm, setNewJenisForm] = useState<NewJenisForm>({ kode: '', nama: '' });

    // Expanded sub mata anggarans
    const [expandedSubs, setExpandedSubs] = useState<Set<number>>(new Set());

    // Add new sub modal
    const [showAddSubModal, setShowAddSubModal] = useState(false);
    const [newSubForm, setNewSubForm] = useState<NewSubForm>({ kode: '', nama: '' });

    // Add new detail modal
    const [showAddDetailModal, setShowAddDetailModal] = useState(false);
    const [addDetailToSubId, setAddDetailToSubId] = useState<number | null>(null);
    const [newDetailForm, setNewDetailForm] = useState<NewDetailForm>({
        kode: '',
        nama: '',
        volume: 1,
        satuan: '',
        harga_satuan: 0,
        keterangan: '',
    });

    // Inline editing states
    const [editingSub, setEditingSub] = useState<EditingSubState | null>(null);
    const [editingDetail, setEditingDetail] = useState<EditingDetailState | null>(null);

    // Delete confirmation
    const [deleteSubConfirm, setDeleteSubConfirm] = useState<SubMataAnggaran | null>(null);
    const [deleteDetailConfirm, setDeleteDetailConfirm] = useState<DetailMataAnggaran | null>(null);

    // Populate form when data loads
    useEffect(() => {
        if (mataAnggaran) {
            setForm({
                no_mata_anggaran_id: mataAnggaran.no_mata_anggaran_id ?? null,
                kode: mataAnggaran.kode,
                nama: mataAnggaran.nama,
                jenis: mataAnggaran.jenis ?? '',
                keterangan: mataAnggaran.keterangan ?? '',
            });
        }
    }, [mataAnggaran]);

    // Queries
    const { data: noMataAnggaransData, isLoading: noMataAnggaransLoading } = useNoMataAnggarans();
    const { data: jenisMataAnggaransData, isLoading: jenisLoading } = useJenisMataAnggarans();
    const { data: subMataAnggaransData, isLoading: subsLoading } = useSubMataAnggarans(mataAnggaranId, { per_page: 100 });

    // Mutations
    const updateMataAnggaran = useUpdateMataAnggaran();
    const createJenisMataAnggaran = useCreateJenisMataAnggaran();
    const createSubMataAnggaran = useCreateSubMataAnggaran();
    const updateSubMataAnggaran = useUpdateSubMataAnggaran();
    const deleteSubMataAnggaran = useDeleteSubMataAnggaran();
    const createDetailMataAnggaran = useCreateDetailMataAnggaran();
    const updateDetailMataAnggaran = useUpdateDetailMataAnggaran();
    const deleteDetailMataAnggaran = useDeleteDetailMataAnggaran();

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

    const jenisOptions = useMemo(() => {
        return (
            jenisMataAnggaransData?.data?.map((jenis) => ({
                value: jenis.kode,
                label: jenis.nama,
            })) ?? []
        );
    }, [jenisMataAnggaransData]);

    const subMataAnggarans = subMataAnggaransData?.data || [];

    const toggleSubExpand = (subId: number) => {
        setExpandedSubs((prev) => {
            const next = new Set(prev);
            if (next.has(subId)) {
                next.delete(subId);
            } else {
                next.add(subId);
            }
            return next;
        });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mataAnggaranId) {
            toast.error('ID Mata Anggaran tidak valid');
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
            const dto: UpdateMataAnggaranDTO = {
                no_mata_anggaran_id: form.no_mata_anggaran_id,
                kode: form.kode,
                nama: form.nama,
                jenis: form.jenis || null,
                keterangan: form.keterangan || null,
            };

            await updateMataAnggaran.mutateAsync({ id: mataAnggaranId, dto });

            toast.success('Mata Anggaran berhasil diperbarui');
            navigate('/budget/mata-anggaran');
        } catch (error) {
            console.error('Failed to update Mata Anggaran:', error);
            toast.error('Gagal memperbarui Mata Anggaran');
        }
    };

    // Sub Mata Anggaran handlers
    const handleAddSub = async () => {
        if (!mataAnggaranId || !mataAnggaran) {
            toast.error('Data mata anggaran tidak valid');
            return;
        }

        if (!newSubForm.kode.trim()) {
            toast.error('Kode sub mata anggaran wajib diisi');
            return;
        }
        if (!newSubForm.nama.trim()) {
            toast.error('Nama sub mata anggaran wajib diisi');
            return;
        }

        try {
            const dto: CreateSubMataAnggaranDTO = {
                mata_anggaran_id: mataAnggaranId,
                unit_id: mataAnggaran.unit_id,
                kode: newSubForm.kode,
                nama: newSubForm.nama,
            };

            await createSubMataAnggaran.mutateAsync(dto);
            toast.success('Sub Mata Anggaran berhasil ditambahkan');
            setNewSubForm({ kode: '', nama: '' });
            setShowAddSubModal(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal membuat sub mata anggaran';
            toast.error(errorMessage);
        }
    };

    const handleStartEditSub = (sub: SubMataAnggaran) => {
        setEditingSub({
            id: sub.id,
            kode: sub.kode,
            nama: sub.nama,
        });
    };

    const handleSaveEditSub = async () => {
        if (!editingSub) return;

        if (!editingSub.kode.trim()) {
            toast.error('Kode sub mata anggaran wajib diisi');
            return;
        }
        if (!editingSub.nama.trim()) {
            toast.error('Nama sub mata anggaran wajib diisi');
            return;
        }

        try {
            const dto: UpdateSubMataAnggaranDTO = {
                kode: editingSub.kode,
                nama: editingSub.nama,
            };

            await updateSubMataAnggaran.mutateAsync({ id: editingSub.id, dto });
            toast.success('Sub Mata Anggaran berhasil diperbarui');
            setEditingSub(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui sub mata anggaran';
            toast.error(errorMessage);
        }
    };

    const handleDeleteSub = async () => {
        if (!deleteSubConfirm) return;

        try {
            await deleteSubMataAnggaran.mutateAsync(deleteSubConfirm.id);
            toast.success('Sub Mata Anggaran berhasil dihapus');
            setDeleteSubConfirm(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus sub mata anggaran';
            toast.error(errorMessage);
        }
    };

    // Detail Mata Anggaran handlers
    const handleOpenAddDetailModal = (subId: number) => {
        setAddDetailToSubId(subId);
        setNewDetailForm({
            kode: '',
            nama: '',
            volume: 1,
            satuan: '',
            harga_satuan: 0,
            keterangan: '',
        });
        setShowAddDetailModal(true);
    };

    const handleAddDetail = async () => {
        if (!mataAnggaranId || !mataAnggaran || addDetailToSubId === null) {
            toast.error('Data tidak valid');
            return;
        }

        if (!newDetailForm.kode.trim()) {
            toast.error('Kode detail wajib diisi');
            return;
        }
        if (!newDetailForm.nama.trim()) {
            toast.error('Nama detail wajib diisi');
            return;
        }
        if (!newDetailForm.satuan.trim()) {
            toast.error('Satuan wajib diisi');
            return;
        }

        try {
            const dto: CreateDetailMataAnggaranDTO = {
                mata_anggaran_id: mataAnggaranId,
                sub_mata_anggaran_id: addDetailToSubId,
                unit_id: mataAnggaran.unit_id,
                kode: newDetailForm.kode,
                nama: newDetailForm.nama,
                volume: newDetailForm.volume,
                satuan: newDetailForm.satuan,
                harga_satuan: newDetailForm.harga_satuan,
                jumlah: newDetailForm.volume * newDetailForm.harga_satuan,
                keterangan: newDetailForm.keterangan || undefined,
            };

            await createDetailMataAnggaran.mutateAsync(dto);
            toast.success('Detail Mata Anggaran berhasil ditambahkan');
            setShowAddDetailModal(false);
            setAddDetailToSubId(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal membuat detail mata anggaran';
            toast.error(errorMessage);
        }
    };

    const handleStartEditDetail = (detail: DetailMataAnggaran) => {
        setEditingDetail({
            id: detail.id,
            kode: detail.kode,
            nama: detail.nama,
            volume: detail.volume,
            satuan: detail.satuan,
            harga_satuan: detail.harga_satuan,
            keterangan: detail.keterangan ?? '',
        });
    };

    const handleSaveEditDetail = async () => {
        if (!editingDetail) return;

        if (!editingDetail.kode.trim()) {
            toast.error('Kode detail wajib diisi');
            return;
        }
        if (!editingDetail.nama.trim()) {
            toast.error('Nama detail wajib diisi');
            return;
        }

        try {
            const dto: UpdateDetailMataAnggaranDTO = {
                kode: editingDetail.kode,
                nama: editingDetail.nama,
                volume: editingDetail.volume,
                satuan: editingDetail.satuan,
                harga_satuan: editingDetail.harga_satuan,
                jumlah: editingDetail.volume * editingDetail.harga_satuan,
                keterangan: editingDetail.keterangan || undefined,
            };

            await updateDetailMataAnggaran.mutateAsync({ id: editingDetail.id, dto });
            toast.success('Detail Mata Anggaran berhasil diperbarui');
            setEditingDetail(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui detail mata anggaran';
            toast.error(errorMessage);
        }
    };

    const handleDeleteDetail = async () => {
        if (!deleteDetailConfirm) return;

        try {
            await deleteDetailMataAnggaran.mutateAsync(deleteDetailConfirm.id);
            toast.success('Detail Mata Anggaran berhasil dihapus');
            setDeleteDetailConfirm(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus detail mata anggaran';
            toast.error(errorMessage);
        }
    };

    // Loading state
    if (isLoadingMa) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError || !mataAnggaran) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">Mata Anggaran tidak ditemukan</p>
                    <button
                        type="button"
                        onClick={() => navigate('/budget/mata-anggaran')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke daftar
                    </button>
                </div>
            </PageTransition>
        );
    }

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
                        title="Edit Mata Anggaran"
                        description={`Edit mata anggaran ${mataAnggaran.kode} beserta sub dan detail`}
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
                        {/* Unit Info Card - Read Only */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Informasi Unit
                                </h2>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {/* Unit - Read Only */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                        {mataAnggaran.unit?.nama || 'Unit tidak ditemukan'}
                                    </div>
                                </div>

                                {/* Tahun - Read Only */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Tahun Anggaran
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                        TA {mataAnggaran.tahun?.includes('/') ? mataAnggaran.tahun : `${mataAnggaran.tahun}/${(parseInt(mataAnggaran.tahun, 10) || 0) + 1}`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mata Anggaran Info Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-lg font-semibold text-slate-900">
                                Informasi Mata Anggaran
                            </h2>

                            <div className="space-y-5">
                                {/* Master COA Reference */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
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
                                </div>

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

                        {/* Sub Mata Anggaran Section */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Sub Mata Anggaran
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowAddSubModal(true)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Sub
                                </button>
                            </div>

                            {subsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            ) : subMataAnggarans.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                                    <p className="text-sm text-slate-500">Belum ada sub mata anggaran</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSubModal(true)}
                                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Tambah Sub Mata Anggaran
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subMataAnggarans.map((sub) => (
                                        <SubMataAnggaranCard
                                            key={sub.id}
                                            sub={sub}
                                            mataAnggaranId={mataAnggaranId!}
                                            isExpanded={expandedSubs.has(sub.id)}
                                            onToggle={() => toggleSubExpand(sub.id)}
                                            editingSub={editingSub}
                                            onStartEdit={() => handleStartEditSub(sub)}
                                            onCancelEdit={() => setEditingSub(null)}
                                            onSaveEdit={handleSaveEditSub}
                                            onEditChange={setEditingSub}
                                            onDelete={() => setDeleteSubConfirm(sub)}
                                            editingDetail={editingDetail}
                                            onStartEditDetail={handleStartEditDetail}
                                            onCancelEditDetail={() => setEditingDetail(null)}
                                            onSaveEditDetail={handleSaveEditDetail}
                                            onEditDetailChange={setEditingDetail}
                                            onDeleteDetail={setDeleteDetailConfirm}
                                            onAddDetail={() => handleOpenAddDetailModal(sub.id)}
                                            isUpdatingSub={updateSubMataAnggaran.isPending}
                                            isUpdatingDetail={updateDetailMataAnggaran.isPending}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/budget/mata-anggaran')}
                                disabled={updateMataAnggaran.isPending}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={updateMataAnggaran.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            >
                                {updateMataAnggaran.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan Perubahan
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

            {/* Modal: Tambah Sub Mata Anggaran */}
            {showAddSubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowAddSubModal(false)}
                    />
                    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Tambah Sub Mata Anggaran
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddSubModal(false)}
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
                                    value={newSubForm.kode}
                                    onChange={(e) => setNewSubForm((prev) => ({ ...prev, kode: e.target.value }))}
                                    placeholder="Contoh: 5.1.01.01"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Nama <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newSubForm.nama}
                                    onChange={(e) => setNewSubForm((prev) => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Nama sub mata anggaran"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAddSubModal(false)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSub}
                                disabled={createSubMataAnggaran.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createSubMataAnggaran.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Simpan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Tambah Detail Mata Anggaran */}
            {showAddDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowAddDetailModal(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Tambah Detail Mata Anggaran
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddDetailModal(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Kode <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newDetailForm.kode}
                                        onChange={(e) => setNewDetailForm((prev) => ({ ...prev, kode: e.target.value }))}
                                        placeholder="Contoh: 5.1.01.01.001"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Satuan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newDetailForm.satuan}
                                        onChange={(e) => setNewDetailForm((prev) => ({ ...prev, satuan: e.target.value }))}
                                        placeholder="Contoh: Bulan, Paket, Unit"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Nama <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newDetailForm.nama}
                                    onChange={(e) => setNewDetailForm((prev) => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Nama detail mata anggaran"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Volume <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={newDetailForm.volume}
                                        onChange={(e) => setNewDetailForm((prev) => ({ ...prev, volume: parseFloat(e.target.value) || 0 }))}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Harga Satuan <span className="text-red-500">*</span>
                                    </label>
                                    <CurrencyInput
                                        value={newDetailForm.harga_satuan}
                                        onChange={(val) => setNewDetailForm((prev) => ({ ...prev, harga_satuan: val }))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">Total Jumlah:</span>
                                    <span className="text-lg font-bold text-slate-900">
                                        {formatRupiah(newDetailForm.volume * newDetailForm.harga_satuan)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Keterangan
                                </label>
                                <textarea
                                    value={newDetailForm.keterangan}
                                    onChange={(e) => setNewDetailForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                                    rows={2}
                                    placeholder="Keterangan (opsional)"
                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAddDetailModal(false)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleAddDetail}
                                disabled={createDetailMataAnggaran.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createDetailMataAnggaran.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Simpan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Sub Confirmation */}
            <ConfirmDialog
                open={!!deleteSubConfirm}
                onOpenChange={(open) => {
                    if (!open) setDeleteSubConfirm(null);
                }}
                title="Hapus Sub Mata Anggaran"
                description={`Apakah Anda yakin ingin menghapus sub mata anggaran "${deleteSubConfirm?.nama}"? Semua detail di bawahnya juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                variant="destructive"
                onConfirm={handleDeleteSub}
            />

            {/* Delete Detail Confirmation */}
            <ConfirmDialog
                open={!!deleteDetailConfirm}
                onOpenChange={(open) => {
                    if (!open) setDeleteDetailConfirm(null);
                }}
                title="Hapus Detail Mata Anggaran"
                description={`Apakah Anda yakin ingin menghapus detail mata anggaran "${deleteDetailConfirm?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                variant="destructive"
                onConfirm={handleDeleteDetail}
            />
        </PageTransition>
    );
}

// ---------------------------------------------------------------------------
// Sub Mata Anggaran Card Component
// ---------------------------------------------------------------------------

interface SubMataAnggaranCardProps {
    sub: SubMataAnggaran;
    mataAnggaranId: number;
    isExpanded: boolean;
    onToggle: () => void;
    editingSub: EditingSubState | null;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onEditChange: (state: EditingSubState) => void;
    onDelete: () => void;
    editingDetail: EditingDetailState | null;
    onStartEditDetail: (detail: DetailMataAnggaran) => void;
    onCancelEditDetail: () => void;
    onSaveEditDetail: () => void;
    onEditDetailChange: (state: EditingDetailState) => void;
    onDeleteDetail: (detail: DetailMataAnggaran) => void;
    onAddDetail: () => void;
    isUpdatingSub: boolean;
    isUpdatingDetail: boolean;
}

function SubMataAnggaranCard({
    sub,
    mataAnggaranId,
    isExpanded,
    onToggle,
    editingSub,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditChange,
    onDelete,
    editingDetail,
    onStartEditDetail,
    onCancelEditDetail,
    onSaveEditDetail,
    onEditDetailChange,
    onDeleteDetail,
    onAddDetail,
    isUpdatingSub,
    isUpdatingDetail,
}: SubMataAnggaranCardProps) {
    const isEditing = editingSub?.id === sub.id;

    // Fetch detail mata anggarans
    const { data: detailsData, isLoading: detailsLoading } = useDetailMataAnggarans(
        isExpanded ? { mata_anggaran_id: mataAnggaranId, sub_mata_anggaran_id: sub.id, per_page: 100 } : null
    );

    const details = detailsData?.data || [];

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            {/* Sub Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

                {isEditing && editingSub ? (
                    <div className="flex flex-1 items-center gap-3">
                        <input
                            type="text"
                            value={editingSub.kode}
                            onChange={(e) => onEditChange({ ...editingSub, kode: e.target.value })}
                            placeholder="Kode"
                            className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-blue-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <input
                            type="text"
                            value={editingSub.nama}
                            onChange={(e) => onEditChange({ ...editingSub, nama: e.target.value })}
                            placeholder="Nama sub"
                            className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                            type="button"
                            onClick={onSaveEdit}
                            disabled={isUpdatingSub}
                            className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                            {isUpdatingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <span className="font-mono text-sm font-medium text-blue-700">{sub.kode}</span>
                        <span className="flex-1 text-sm text-slate-700">{sub.nama}</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={onStartEdit}
                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Detail List */}
            {isExpanded && (
                <div className="bg-slate-50/50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Detail Mata Anggaran
                        </p>
                        <button
                            type="button"
                            onClick={onAddDetail}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            <Plus className="h-3 w-3" />
                            Tambah Detail
                        </button>
                    </div>

                    {detailsLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        </div>
                    ) : details.length === 0 ? (
                        <div className="rounded border border-dashed border-slate-300 bg-white px-4 py-4 text-center">
                            <p className="text-sm text-slate-500">Belum ada detail</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {details.map((detail) => (
                                <DetailMataAnggaranRow
                                    key={detail.id}
                                    detail={detail}
                                    editingDetail={editingDetail}
                                    onStartEdit={() => onStartEditDetail(detail)}
                                    onCancelEdit={onCancelEditDetail}
                                    onSaveEdit={onSaveEditDetail}
                                    onEditChange={onEditDetailChange}
                                    onDelete={() => onDeleteDetail(detail)}
                                    isUpdating={isUpdatingDetail}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Detail Mata Anggaran Row Component
// ---------------------------------------------------------------------------

interface DetailMataAnggaranRowProps {
    detail: DetailMataAnggaran;
    editingDetail: EditingDetailState | null;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onEditChange: (state: EditingDetailState) => void;
    onDelete: () => void;
    isUpdating: boolean;
}

function DetailMataAnggaranRow({
    detail,
    editingDetail,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditChange,
    onDelete,
    isUpdating,
}: DetailMataAnggaranRowProps) {
    const isEditing = editingDetail?.id === detail.id;

    if (isEditing && editingDetail) {
        return (
            <div className="rounded-lg border border-blue-200 bg-white p-3">
                <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Kode</label>
                            <input
                                type="text"
                                value={editingDetail.kode}
                                onChange={(e) => onEditChange({ ...editingDetail, kode: e.target.value })}
                                className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Satuan</label>
                            <input
                                type="text"
                                value={editingDetail.satuan}
                                onChange={(e) => onEditChange({ ...editingDetail, satuan: e.target.value })}
                                className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Nama</label>
                        <input
                            type="text"
                            value={editingDetail.nama}
                            onChange={(e) => onEditChange({ ...editingDetail, nama: e.target.value })}
                            className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Volume</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={editingDetail.volume}
                                onChange={(e) => onEditChange({ ...editingDetail, volume: parseFloat(e.target.value) || 0 })}
                                className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Harga Satuan</label>
                            <CurrencyInput
                                value={editingDetail.harga_satuan}
                                onChange={(val) => onEditChange({ ...editingDetail, harga_satuan: val })}
                            />
                        </div>
                    </div>

                    <div className="rounded bg-slate-100 px-3 py-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">Total:</span>
                            <span className="text-sm font-bold text-slate-900">
                                {formatRupiah(editingDetail.volume * editingDetail.harga_satuan)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Keterangan</label>
                        <input
                            type="text"
                            value={editingDetail.keterangan}
                            onChange={(e) => onEditChange({ ...editingDetail, keterangan: e.target.value })}
                            placeholder="Opsional"
                            className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSaveEdit}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <span className="font-mono text-xs font-medium text-emerald-600">{detail.kode}</span>
            <span className="flex-1 text-sm text-slate-700">{detail.nama}</span>
            <span className="text-xs text-slate-500">
                {detail.volume} {detail.satuan}
            </span>
            <span className="text-xs text-slate-500">@ {formatRupiah(detail.harga_satuan)}</span>
            <span className="text-sm font-medium text-slate-900">{formatRupiah(detail.jumlah)}</span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onStartEdit}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
