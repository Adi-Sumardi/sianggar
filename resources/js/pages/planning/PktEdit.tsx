import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Save, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

import { usePkt, useUpdatePkt } from '@/hooks/usePlanning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
    deskripsi_kegiatan: string;
    tujuan_kegiatan: string;
    saldo_anggaran: number;
    volume: number;
    satuan: string;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatTahunAnggaran(tahun: string): string {
    if (tahun.includes('/')) return tahun;
    const year = parseInt(tahun);
    if (isNaN(year)) return tahun;
    return `${year}/${year + 1}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PktEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Fetch PKT data
    const pktId = id ? parseInt(id) : null;
    const { data: pkt, isLoading: pktLoading } = usePkt(pktId);

    // Form state — only editable fields
    const [form, setForm] = useState<FormData>({
        deskripsi_kegiatan: '',
        tujuan_kegiatan: '',
        saldo_anggaran: 0,
        volume: 1,
        satuan: 'paket',
    });

    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize form with PKT data
    useEffect(() => {
        if (pkt && !isInitialized) {
            setForm({
                deskripsi_kegiatan: pkt.deskripsi_kegiatan || '',
                tujuan_kegiatan: pkt.tujuan_kegiatan || '',
                saldo_anggaran: pkt.saldo_anggaran || 0,
                volume: pkt.volume || 1,
                satuan: pkt.satuan || 'paket',
            });
            setIsInitialized(true);
        }
    }, [pkt, isInitialized]);

    // Mutations
    const updatePkt = useUpdatePkt();

    // Handlers
    const handleSubmit = async () => {
        if (!pktId) return;

        try {
            await updatePkt.mutateAsync({
                id: pktId,
                dto: {
                    deskripsi_kegiatan: form.deskripsi_kegiatan || undefined,
                    tujuan_kegiatan: form.tujuan_kegiatan || undefined,
                    saldo_anggaran: form.saldo_anggaran,
                    volume: form.volume,
                    satuan: form.satuan,
                },
            });
            toast.success('PKT berhasil diperbarui');
            navigate('/planning/pkt');
        } catch {
            toast.error('Gagal memperbarui PKT');
        }
    };

    const isSubmitting = updatePkt.isPending;

    if (pktLoading) {
        return (
            <PageTransition>
                <div className="flex min-h-100 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (!pkt) {
        return (
            <PageTransition>
                <div className="flex min-h-100 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-lg font-medium text-slate-900">PKT tidak ditemukan</p>
                    <button
                        type="button"
                        onClick={() => navigate('/planning/pkt')}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Kembali ke Daftar PKT
                    </button>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Edit Program Kerja Tahunan (PKT)"
                        description="Perbarui data PKT yang sudah ada"
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
                                Anda dapat mengubah Deskripsi, Tujuan, Saldo Anggaran, Volume, dan Satuan
                            </p>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* Row 1: Unit & Tahun (Read-only) */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Unit</label>
                                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                                        <span className="font-medium">
                                            {pkt.unit_relation?.kode || pkt.unit || '-'} - {pkt.unit_relation?.nama || '-'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tahun Anggaran</label>
                                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                                        <span className="font-medium">TA {formatTahunAnggaran(pkt.tahun)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hierarchy info panel (Read-only) */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-800">
                                    <Info className="h-4 w-4" />
                                    Hierarki Perencanaan (tidak dapat diubah)
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Sasaran Strategis</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.strategy?.kode || '-'} - {pkt.strategy?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Indikator</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.indikator?.kode || '-'} - {pkt.indikator?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Program Kerja</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.proker?.kode || '-'} - {pkt.proker?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Kegiatan</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.kegiatan?.kode || '-'} - {pkt.kegiatan?.nama || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mata Anggaran (Read-only) */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                                <div className="mb-3 text-sm font-medium text-slate-700">
                                    Mata Anggaran (tidak dapat diubah)
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Mata Anggaran</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.mata_anggaran?.kode || '-'} - {pkt.mata_anggaran?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Sub Mata Anggaran</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-800">
                                            {pkt.sub_mata_anggaran ? `${pkt.sub_mata_anggaran.kode} - ${pkt.sub_mata_anggaran.nama}` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Detail Kegiatan</h3>
                            </div>

                            {/* Row: Deskripsi & Tujuan (Editable) */}
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

                            {/* Row: Saldo Anggaran */}
                            <div className="max-w-sm">
                                <CurrencyInput
                                    label="Saldo Anggaran"
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
                                disabled={isSubmitting}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors',
                                    !isSubmitting
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
                                        Simpan Perubahan
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
