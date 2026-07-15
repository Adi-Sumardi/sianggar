import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { formatDateIndonesian } from '@/lib/numberToWords';
import { formatRupiah } from '@/lib/currency';
import type { Lpj } from '@/types/models';

interface LpjVoucherModalProps {
    lpj: Lpj;
    open: boolean;
    onClose: () => void;
    onPrint: () => void;
    isPrinting?: boolean;
}

export function LpjVoucherModal({ lpj, open, onClose, onPrint, isPrinting }: LpjVoucherModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const amount = lpj.input_realisasi || 0;
    const unitName = lpj.pengajuan_anggaran?.unit?.nama || lpj.unit || '-';
    const pengajuName = lpj.pengajuan_anggaran?.user?.name || '-';

    // Print date must be frozen at the moment Kasir printed it (printed_at),
    // not the current date — otherwise reprinting changes the printed date.
    // Fallback to now() only when it hasn't been printed yet.
    const printDate = lpj.printed_at ? new Date(lpj.printed_at) : new Date();

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bukti LPJ ${lpj.no_surat || ''}</title>
                <style>
                    @page {
                        size: A5 landscape;
                        margin: 12mm 6mm 6mm 6mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-weight: bold;
                        font-size: 12pt;
                        line-height: 1.5;
                        padding: 10px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                </style>
            </head>
            <body>
                <div style="border: 2px dashed #000; padding: 10px; max-width: 100%; font-family: 'Courier New', Courier, monospace; font-weight: bold; font-size: 12pt; margin-top: 8px;">
                    <!-- Header -->
                    <div style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 15px; text-transform: uppercase;">
                        BUKTI LAPORAN PERTANGGUNGJAWABAN YAYASAN ASRAMA PELAJAR ISLAM
                    </div>

                    <!-- Info Rows - 2 columns -->
                    <div style="display: flex; margin-bottom: 12px;">
                        <!-- Left Column -->
                        <div style="flex: 1;">
                            <div style="margin-bottom: 3px;">
                                <span style="display: inline-block; width: 110px;">Nomor LPJ</span>
                                <span>: ${lpj.no_surat || '-'}</span>
                            </div>
                            <div>
                                <span style="display: inline-block; width: 110px;">Unit</span>
                                <span>: ${unitName}</span>
                            </div>
                        </div>
                        <!-- Right Column -->
                        <div style="text-align: right; width: 220px; white-space: nowrap;">
                            <div style="margin-bottom: 3px;">
                                <span>Tanggal Cetak : ${formatDateIndonesian(printDate)}</span>
                            </div>
                            <div>
                                <span>Tahun : </span>
                                <span style="font-weight: bold;">${lpj.tahun || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Full width rows -->
                    <div style="margin-bottom: 12px;">
                        <div style="margin-bottom: 3px;">
                            <span style="display: inline-block; width: 110px;">Perihal</span>
                            <span>: ${lpj.perihal || '-'}</span>
                        </div>
                        <div style="margin-bottom: 3px;">
                            <span style="display: inline-block; width: 110px;">Pengaju</span>
                            <span>: ${pengajuName}</span>
                        </div>
                        <div>
                            <span style="display: inline-block; width: 110px;">Jumlah Realisasi</span>
                            <span>: ${formatRupiah(amount)}</span>
                        </div>
                    </div>

                    <!-- Signature Row -->
                    <div style="display: flex; justify-content: space-between; margin-top: 20px; text-align: center;">
                        <div style="width: 30%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Diperiksa</div>
                            <div style="font-weight: bold; font-size: 10pt;">Tgl.</div>
                        </div>
                        <div style="width: 30%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Diketahui</div>
                            <div style="font-weight: bold; font-size: 10pt;">Tgl.</div>
                        </div>
                        <div style="width: 30%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Dibukukan</div>
                            <div style="font-weight: bold; font-size: 10pt;">Tgl.</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            onPrint();
        }, 250);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-4xl rounded-xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Preview Bukti LPJ
                                </h3>
                                <p className="text-sm text-slate-500">
                                    No. LPJ: {lpj.no_surat || '-'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Voucher Content - Scrollable */}
                        <div className="max-h-[60vh] overflow-auto p-6 bg-slate-50">
                            <div
                                ref={printRef}
                                className="bg-white p-6 border-2 border-dashed border-slate-400 mt-2"
                                style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bold', fontSize: '12pt', lineHeight: '1.5' }}
                            >
                                {/* Header */}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', marginBottom: '15px', textTransform: 'uppercase' }}>
                                    BUKTI LAPORAN PERTANGGUNGJAWABAN YAYASAN ASRAMA PELAJAR ISLAM
                                </div>

                                {/* Info Rows - 2 columns */}
                                <div style={{ display: 'flex', marginBottom: '12px' }}>
                                    {/* Left Column */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '3px' }}>
                                            <span style={{ display: 'inline-block', width: '110px' }}>Nomor LPJ</span>
                                            <span>: {lpj.no_surat || '-'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'inline-block', width: '110px' }}>Unit</span>
                                            <span>: {unitName}</span>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div style={{ textAlign: 'right', width: '220px', whiteSpace: 'nowrap' }}>
                                        <div style={{ marginBottom: '3px' }}>
                                            <span>Tanggal Cetak : {formatDateIndonesian(printDate)}</span>
                                        </div>
                                        <div>
                                            <span>Tahun : </span>
                                            <span style={{ fontWeight: 'bold' }}>{lpj.tahun || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Full width rows */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ marginBottom: '3px' }}>
                                        <span style={{ display: 'inline-block', width: '110px' }}>Perihal</span>
                                        <span>: {lpj.perihal || '-'}</span>
                                    </div>
                                    <div style={{ marginBottom: '3px' }}>
                                        <span style={{ display: 'inline-block', width: '110px' }}>Pengaju</span>
                                        <span>: {pengajuName}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'inline-block', width: '110px' }}>Jumlah Realisasi</span>
                                        <span>: {formatRupiah(amount)}</span>
                                    </div>
                                </div>

                                {/* Signature Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', textAlign: 'center' }}>
                                    <div style={{ width: '30%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Diperiksa</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '30%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Diketahui</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '30%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Dibukukan</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>Tgl.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Printer className="h-4 w-4" />
                                {isPrinting ? 'Mencetak...' : 'Print LPJ'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
