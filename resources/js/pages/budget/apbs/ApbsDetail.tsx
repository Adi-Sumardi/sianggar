import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Printer, Download, Building2, Calendar, FileText, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatRupiah } from '@/lib/currency';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useApbsDetail } from '@/hooks/useBudget';

// ---------------------------------------------------------------------------
// Print Content Component
// ---------------------------------------------------------------------------

interface PrintContentProps {
    apbs: {
        id: number;
        unit?: { nama: string; kode?: string };
        tahun: string;
        nomor_dokumen?: string | null;
        tanggal_pengesahan?: string | null;
        total_anggaran: number;
        total_realisasi: number;
        sisa_anggaran: number;
        items?: Array<{
            id: number;
            nama: string;
            kode_coa?: string;
            anggaran: number;
            realisasi: number;
            sisa: number;
        }>;
        ttd_kepala_sekolah?: string | null;
        ttd_bendahara?: string | null;
        ttd_ketua_umum?: string | null;
    };
}

function PrintContent({ apbs }: PrintContentProps) {
    const items = apbs.items ?? [];

    return (
        <div className="bg-white p-8 print:p-4" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-xl font-bold uppercase tracking-wide">
                    Lembar Pengesahan
                </h1>
                <h2 className="text-lg font-bold uppercase mt-1">
                    Anggaran Pendapatan dan Belanja Sekolah (APBS)
                </h2>
                <h3 className="text-base font-semibold mt-1">
                    Tahun Anggaran {apbs.tahun}
                </h3>
            </div>

            {/* Document Info */}
            <div className="mb-6 border border-slate-300 p-4 rounded">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                    <div>
                        <span className="font-semibold">Nomor Dokumen:</span>
                        <span className="ml-2">{apbs.nomor_dokumen || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Tanggal Pengesahan:</span>
                        <span className="ml-2">
                            {apbs.tanggal_pengesahan
                                ? new Date(apbs.tanggal_pengesahan).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                  })
                                : '-'}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold">Unit:</span>
                        <span className="ml-2">{apbs.unit?.nama || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Kode Unit:</span>
                        <span className="ml-2">{apbs.unit?.kode || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Budget Summary */}
            <div className="mb-6">
                <h4 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">RINGKASAN ANGGARAN</h4>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        <tr>
                            <td className="py-1 w-1/2">Total Anggaran</td>
                            <td className="py-1 text-right font-semibold">{formatRupiah(apbs.total_anggaran)}</td>
                        </tr>
                        <tr>
                            <td className="py-1">Total Realisasi</td>
                            <td className="py-1 text-right font-semibold">{formatRupiah(apbs.total_realisasi)}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                            <td className="py-1 font-bold">Sisa Anggaran</td>
                            <td className="py-1 text-right font-bold">{formatRupiah(apbs.sisa_anggaran)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Detail Items */}
            {items.length > 0 && (
                <div className="mb-8">
                    <h4 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">RINCIAN ANGGARAN</h4>
                    <table className="w-full text-xs border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-2 py-1 text-left">No</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Kode COA</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Uraian</th>
                                <th className="border border-slate-300 px-2 py-1 text-right">Anggaran</th>
                                <th className="border border-slate-300 px-2 py-1 text-right">Realisasi</th>
                                <th className="border border-slate-300 px-2 py-1 text-right">Sisa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="border border-slate-300 px-2 py-1">{idx + 1}</td>
                                    <td className="border border-slate-300 px-2 py-1">{item.kode_coa || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-1">{item.nama}</td>
                                    <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(item.anggaran)}</td>
                                    <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(item.realisasi)}</td>
                                    <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(item.sisa)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 font-semibold">
                                <td className="border border-slate-300 px-2 py-1" colSpan={3}>TOTAL</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(apbs.total_anggaran)}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(apbs.total_realisasi)}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(apbs.sisa_anggaran)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Signature Section */}
            <div className="mt-12 page-break-inside-avoid">
                <p className="text-sm text-right mb-8">
                    Ditetapkan di: Jakarta<br />
                    Pada tanggal:{' '}
                    {apbs.tanggal_pengesahan
                        ? new Date(apbs.tanggal_pengesahan).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                          })
                        : '............................'}
                </p>

                <div className="grid grid-cols-1 gap-4 text-center text-sm sm:grid-cols-3 sm:gap-8">
                    {/* Kepala Sekolah */}
                    <div>
                        <p className="font-semibold mb-16">Kepala Sekolah</p>
                        <div className="border-b border-slate-400 mx-4 mb-1" />
                        <p className="text-xs text-slate-500">
                            {apbs.ttd_kepala_sekolah || '(................................)'}
                        </p>
                    </div>

                    {/* Bendahara */}
                    <div>
                        <p className="font-semibold mb-16">Bendahara</p>
                        <div className="border-b border-slate-400 mx-4 mb-1" />
                        <p className="text-xs text-slate-500">
                            {apbs.ttd_bendahara || '(................................)'}
                        </p>
                    </div>

                    {/* Ketua Umum */}
                    <div>
                        <p className="font-semibold mb-16">Ketua Umum</p>
                        <div className="border-b border-slate-400 mx-4 mb-1" />
                        <p className="text-xs text-slate-500">
                            {apbs.ttd_ketua_umum || '(................................)'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center print:mt-4">
                <p>Dokumen ini digenerate oleh SIANGGAR - Sistem Informasi Pengajuan Anggaran</p>
                <p>Dokumen ID: {apbs.nomor_dokumen || apbs.id}</p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ApbsDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    const { data: apbs, isLoading, isError } = useApbsDetail(Number(id));

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `APBS-${apbs?.nomor_dokumen || id}`,
    });

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (isError || !apbs) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">Gagal memuat data APBS</p>
                    <button
                        type="button"
                        onClick={() => navigate('/budget/apbs')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke daftar APBS
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
                        title="Pengesahan APBS"
                        description={`${apbs.unit?.nama || 'Unit'} - Tahun ${apbs.tahun}`}
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/budget/apbs')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePrint()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    <Printer className="h-4 w-4" />
                                    Cetak
                                </button>
                            </div>
                        }
                    />
                </motion.div>

                {/* Info Cards */}
                <motion.div variants={staggerItem} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Nomor Dokumen</p>
                                <p className="font-semibold text-slate-900">{apbs.nomor_dokumen || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Unit</p>
                                <p className="font-semibold text-slate-900">{apbs.unit?.nama || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 p-2">
                                <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Tahun Anggaran</p>
                                <p className="font-semibold text-slate-900">{apbs.tahun}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-purple-100 p-2">
                                <Download className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Anggaran</p>
                                <p className="font-semibold text-slate-900">{formatRupiah(apbs.total_anggaran)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Print Preview */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h3 className="font-semibold text-slate-900">Preview Dokumen Pengesahan</h3>
                            <p className="text-xs text-slate-500">Klik tombol "Cetak" untuk mencetak dokumen ini</p>
                        </div>
                        <div ref={printRef} className="print:shadow-none">
                            <PrintContent apbs={apbs} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </PageTransition>
    );
}
