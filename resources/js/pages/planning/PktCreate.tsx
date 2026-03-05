import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Save, Info } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

import {
    useKegiatans,
    useCreatePkt,
} from '@/hooks/usePlanning';
import { useMataAnggarans, useSubMataAnggarans } from '@/hooks/useBudget';
import { useRapbsList } from '@/hooks/useRapbsApproval';
import { useAuth } from '@/hooks/useAuth';
import { getAcademicYearOptions } from '@/stores/authStore';
import { RapbsStatus } from '@/types/enums';
import type { Kegiatan } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
    unit_id: number | null;
    tahun: string;
    strategy_id: number | null;
    indikator_id: number | null;
    proker_id: number | null;
    kegiatan_id: number | null;
    mata_anggaran_id: number | null;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    deskripsi_kegiatan: string;
    tujuan_kegiatan: string;
    saldo_anggaran: number;
    volume: number;
    satuan: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Generate tahun anggaran options (TA 2024/2025, TA 2025/2026, etc.)
function generateTahunAnggaranOptions() {
    return getAcademicYearOptions().map((ay) => ({
        value: ay,
        label: `TA ${ay}`,
    }));
}

export default function PktCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state - unit_id will be set from user
    const [form, setForm] = useState<FormData>({
        unit_id: null,
        tahun: '2026/2027',
        strategy_id: null,
        indikator_id: null,
        proker_id: null,
        kegiatan_id: null,
        mata_anggaran_id: null,
        sub_mata_anggaran_id: null,
        detail_mata_anggaran_id: null,
        deskripsi_kegiatan: '',
        tujuan_kegiatan: '',
        saldo_anggaran: 0,
        volume: 1,
        satuan: 'paket',
    });

    // Track the selected kegiatan object for displaying hierarchy info
    const [selectedKegiatan, setSelectedKegiatan] = useState<Kegiatan | null>(null);

    // Set unit_id from current user on mount
    useEffect(() => {
        if (user?.unit_id) {
            setForm((prev) => ({ ...prev, unit_id: user.unit_id }));
        }
    }, [user?.unit_id]);

    // Check if unit's RAPBS is locked — redirect if so
    const { data: rapbsData } = useRapbsList(
        user?.unit_id ? { unit_id: user.unit_id } : undefined,
    );
    const unitRapbs = rapbsData?.data?.[0];
    const rapbsLocked = !!unitRapbs &&
        unitRapbs.status !== RapbsStatus.Draft &&
        unitRapbs.status !== RapbsStatus.Rejected;
    const rapbsApproved = !!unitRapbs && (
        unitRapbs.status === RapbsStatus.Approved ||
        unitRapbs.status === RapbsStatus.ApbsGenerated ||
        unitRapbs.status === RapbsStatus.Active
    );

    useEffect(() => {
        if (rapbsLocked) {
            toast.warning(rapbsApproved
                ? 'RAPBS sudah diapprove, pengisian PKT ditutup.'
                : 'Tidak dapat menambah PKT karena RAPBS sedang dalam proses pengajuan.',
            );
            navigate('/planning/pkt');
        }
    }, [rapbsLocked, rapbsApproved, navigate]);

    // API Queries — fetch all kegiatans for user's unit (backend auto-filters by unit)
    const { data: kegiatansData, isLoading: kegiatansLoading } = useKegiatans({ per_page: 500 });

    // Mata Anggaran filtered by user's unit
    const { data: mataAnggaransData, isLoading: mataAnggaransLoading } = useMataAnggarans(
        form.unit_id ? { unit_id: form.unit_id, tahun: form.tahun, per_page: 500 } : undefined
    );

    const { data: subMataAnggaransData, isLoading: subMataAnggaransLoading } = useSubMataAnggarans(
        form.mata_anggaran_id,
        { per_page: 500 }
    );

    // Mutations
    const createPkt = useCreatePkt();

    // Transform data for SearchableSelect
    const tahunOptions = useMemo(() => generateTahunAnggaranOptions(), []);

    // Flat list of all kegiatan with hierarchy info in label
    const kegiatanList = useMemo(() => {
        return kegiatansData?.data ?? [];
    }, [kegiatansData]);

    const kegiatanOptions = useMemo(() => {
        return kegiatanList.map((k) => ({
            value: k.id.toString(),
            label: `${k.kode || 'N/A'} - ${k.nama || 'N/A'}`,
            description: `Proker: ${k.proker?.nama || '-'} | Strategi: ${k.strategy?.nama || '-'}`,
        }));
    }, [kegiatanList]);

    const mataAnggaranOptions = useMemo(() => {
        const data = mataAnggaransData?.data ?? mataAnggaransData ?? [];
        if (!Array.isArray(data)) return [];
        return data.map((m) => ({
            value: m.id.toString(),
            label: `${m.kode} - ${m.nama}`,
            description: `Tahun: ${m.tahun}`,
        }));
    }, [mataAnggaransData]);

    const subMataAnggaranOptions = useMemo(() => {
        const data = subMataAnggaransData?.data ?? subMataAnggaransData ?? [];
        if (!Array.isArray(data)) return [];
        return data.map((s) => ({
            value: s.id.toString(),
            label: `${s.kode} - ${s.nama}`,
        }));
    }, [subMataAnggaransData]);

    // Reset sub_mata_anggaran when mata_anggaran changes
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            sub_mata_anggaran_id: null,
        }));
    }, [form.mata_anggaran_id]);

    // Reset mata anggaran when tahun changes
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            mata_anggaran_id: null,
            sub_mata_anggaran_id: null,
        }));
    }, [form.tahun]);

    // Handle kegiatan selection — auto-fill strategy, indikator, proker
    const handleKegiatanChange = (val: string) => {
        if (!val) {
            setSelectedKegiatan(null);
            setForm((prev) => ({
                ...prev,
                kegiatan_id: null,
                strategy_id: null,
                indikator_id: null,
                proker_id: null,
            }));
            return;
        }

        const kegiatanId = parseInt(val);
        const kegiatan = kegiatanList.find((k) => k.id === kegiatanId) ?? null;

        setSelectedKegiatan(kegiatan);
        setForm((prev) => ({
            ...prev,
            kegiatan_id: kegiatanId,
            strategy_id: kegiatan?.strategy_id ?? null,
            indikator_id: kegiatan?.indikator_id ?? null,
            proker_id: kegiatan?.proker_id ?? null,
        }));
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!form.tahun || !form.strategy_id || !form.indikator_id || !form.proker_id || !form.kegiatan_id || !form.mata_anggaran_id || !form.sub_mata_anggaran_id) {
            toast.error('Field yang wajib harus diisi');
            return;
        }

        if (!form.saldo_anggaran || form.saldo_anggaran <= 0) {
            toast.error('Nilai Anggaran Awal yang Diajukan wajib diisi dan harus lebih dari 0');
            return;
        }

        try {
            await createPkt.mutateAsync({
                strategy_id: form.strategy_id,
                indikator_id: form.indikator_id,
                proker_id: form.proker_id,
                kegiatan_id: form.kegiatan_id,
                mata_anggaran_id: form.mata_anggaran_id,
                sub_mata_anggaran_id: form.sub_mata_anggaran_id,
                tahun: form.tahun,
                unit: user?.unit?.kode || '',
                deskripsi_kegiatan: form.deskripsi_kegiatan || undefined,
                tujuan_kegiatan: form.tujuan_kegiatan || undefined,
                saldo_anggaran: form.saldo_anggaran,
                volume: form.volume,
                satuan: form.satuan,
            });
            toast.success('PKT berhasil dibuat');
            navigate('/planning/pkt');
        } catch {
            toast.error('Gagal membuat PKT');
        }
    };

    const isSubmitting = createPkt.isPending;
    const canSubmit = form.tahun && form.kegiatan_id && form.mata_anggaran_id && form.sub_mata_anggaran_id && form.saldo_anggaran > 0;

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Tambah Program Kerja Tahunan (PKT)"
                        description="Buat PKT baru dengan memilih kegiatan dan mata anggaran"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/planning/pkt')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                {/* Form */}
                <motion.div variants={staggerItem} className="mt-6">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">Informasi PKT</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Pilih kegiatan, lalu data strategi, indikator, dan program kerja akan terisi otomatis
                            </p>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* Row 1: Unit & Tahun */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                                        {user?.unit ? (
                                            <span className="font-medium">{user.unit.kode} - {user.unit.nama}</span>
                                        ) : (
                                            <span className="text-slate-400">Unit tidak tersedia</span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Unit otomatis berdasarkan akun Anda
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tahun Anggaran <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={tahunOptions}
                                        value={form.tahun}
                                        onChange={(val) => setForm((prev) => ({
                                            ...prev,
                                            tahun: val,
                                        }))}
                                        placeholder="Pilih tahun anggaran..."
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Pilih Kegiatan</h3>
                            </div>

                            {/* Kegiatan dropdown */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Kegiatan <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={kegiatanOptions}
                                    value={form.kegiatan_id?.toString() || ''}
                                    onChange={handleKegiatanChange}
                                    placeholder="Pilih kegiatan..."
                                    searchPlaceholder="Cari kegiatan berdasarkan kode atau nama..."
                                    isLoading={kegiatansLoading}
                                    emptyMessage="Tidak ada kegiatan. Buat kegiatan terlebih dahulu di menu Kegiatan."
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Data strategi, indikator, dan program kerja akan terisi otomatis dari kegiatan yang dipilih
                                </p>
                            </div>

                            {/* Hierarchy info panel — shown after kegiatan is selected */}
                            {selectedKegiatan && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-800">
                                        <Info className="h-4 w-4" />
                                        Hierarki Perencanaan (otomatis dari kegiatan)
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Sasaran Strategis</span>
                                            <p className="mt-0.5 text-sm font-medium text-slate-800">
                                                {selectedKegiatan.strategy?.kode} - {selectedKegiatan.strategy?.nama}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Indikator</span>
                                            <p className="mt-0.5 text-sm font-medium text-slate-800">
                                                {selectedKegiatan.indikator?.kode} - {selectedKegiatan.indikator?.nama}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Program Kerja</span>
                                            <p className="mt-0.5 text-sm font-medium text-slate-800">
                                                {selectedKegiatan.proker?.kode} - {selectedKegiatan.proker?.nama}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Mata Anggaran</h3>
                            </div>

                            {/* Row: Mata Anggaran & Sub Mata Anggaran */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Mata Anggaran <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={mataAnggaranOptions}
                                        value={form.mata_anggaran_id?.toString() || ''}
                                        onChange={(val) => setForm((prev) => ({
                                            ...prev,
                                            mata_anggaran_id: val ? parseInt(val) : null,
                                        }))}
                                        placeholder={form.unit_id ? 'Pilih mata anggaran...' : 'Pilih unit terlebih dahulu'}
                                        searchPlaceholder="Cari mata anggaran..."
                                        disabled={!form.unit_id}
                                        isLoading={mataAnggaransLoading}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Sub Mata Anggaran <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={subMataAnggaranOptions}
                                        value={form.sub_mata_anggaran_id?.toString() || ''}
                                        onChange={(val) => setForm((prev) => ({
                                            ...prev,
                                            sub_mata_anggaran_id: val ? parseInt(val) : null,
                                        }))}
                                        placeholder={form.mata_anggaran_id ? 'Pilih sub mata anggaran...' : 'Pilih mata anggaran terlebih dahulu'}
                                        searchPlaceholder="Cari sub mata anggaran..."
                                        disabled={!form.mata_anggaran_id}
                                        isLoading={subMataAnggaransLoading}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Detail Kegiatan</h3>
                            </div>

                            {/* Row: Deskripsi & Tujuan */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Deskripsi Kegiatan
                                    </label>
                                    <textarea
                                        value={form.deskripsi_kegiatan}
                                        onChange={(e) => setForm((prev) => ({
                                            ...prev,
                                            deskripsi_kegiatan: e.target.value,
                                        }))}
                                        placeholder="Deskripsi kegiatan..."
                                        rows={3}
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tujuan Kegiatan
                                    </label>
                                    <textarea
                                        value={form.tujuan_kegiatan}
                                        onChange={(e) => setForm((prev) => ({
                                            ...prev,
                                            tujuan_kegiatan: e.target.value,
                                        }))}
                                        placeholder="Tujuan kegiatan..."
                                        rows={3}
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* Row: Nilai Anggaran Awal yang Diajukan */}
                            <div className="max-w-sm">
                                <CurrencyInput
                                    label={<>Nilai Anggaran Awal yang Diajukan <span className="text-red-500">*</span></>}
                                    value={form.saldo_anggaran}
                                    onChange={(val) => setForm((prev) => ({
                                        ...prev,
                                        saldo_anggaran: val,
                                    }))}
                                />
                            </div>

                            {/* Row: Volume & Satuan */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Volume
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.volume}
                                        onChange={(e) => setForm((prev) => ({
                                            ...prev,
                                            volume: parseFloat(e.target.value) || 0,
                                        }))}
                                        placeholder="1"
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Jumlah/kuantitas kegiatan
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Satuan
                                    </label>
                                    <input
                                        type="text"
                                        value={form.satuan}
                                        onChange={(e) => setForm((prev) => ({
                                            ...prev,
                                            satuan: e.target.value,
                                        }))}
                                        placeholder="paket"
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Contoh: paket, unit, kegiatan, orang
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => navigate('/planning/pkt')}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !canSubmit}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors',
                                    canSubmit && !isSubmitting
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'cursor-not-allowed bg-slate-400'
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan PKT
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
