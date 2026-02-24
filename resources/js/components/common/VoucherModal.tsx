import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { numberToWords, formatDateIndonesian } from '@/lib/numberToWords';
import { formatRupiah } from '@/lib/currency';
import type { PengajuanAnggaran } from '@/types/models';

interface VoucherModalProps {
    pengajuan: PengajuanAnggaran;
    open: boolean;
    onClose: () => void;
    onPrint: () => void;
    isPrinting?: boolean;
}

export function VoucherModal({ pengajuan, open, onClose, onPrint, isPrinting }: VoucherModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const amount = pengajuan.approved_amount || pengajuan.jumlah_pengajuan_total;
    const today = new Date();

    // Build budget code from details
    const getDetailRows = () => {
        const details = pengajuan.detail_pengajuans || [];
        if (details.length === 0) {
            return [{
                kode: '-',
                nama: pengajuan.perihal || '-',
                jumlah: amount,
            }];
        }

        return details.map((detail) => {
            const kodeParts = [];
            if (detail.mata_anggaran?.kode) kodeParts.push(detail.mata_anggaran.kode);
            if (detail.sub_mata_anggaran?.kode) kodeParts.push(detail.sub_mata_anggaran.kode);
            if (detail.detail_mata_anggaran?.kode) kodeParts.push(detail.detail_mata_anggaran.kode);

            return {
                kode: kodeParts.join('-') || '-',
                nama: detail.sub_mata_anggaran?.nama || detail.uraian || '-',
                jumlah: detail.jumlah,
            };
        });
    };

    const detailRows = getDetailRows();

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        // Generate table rows HTML
        const tableRowsHtml = detailRows.map((row) => `
            <tr>
                <td style="border: 1px dashed #000; padding: 4px 6px;">
                    ${row.kode}
                </td>
                <td style="border: 1px dashed #000; padding: 4px 6px;">
                    ${row.nama}
                </td>
                <td style="border: 1px dashed #000; padding: 4px 6px; text-align: right;">
                    ${formatRupiah(row.jumlah)}
                </td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Voucher ${pengajuan.no_voucher}</title>
                <style>
                    @page {
                        size: A5 landscape;
                        margin: 5mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 10pt;
                        line-height: 1.4;
                        padding: 10px;
                    }
                </style>
            </head>
            <body>
                <div style="border: 1px dashed #000; padding: 10px; max-width: 100%; font-family: 'Courier New', Courier, monospace; font-size: 10pt;">
                    <!-- Header -->
                    <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 15px; text-transform: uppercase;">
                        BUKTI PENGELUARAN KAS YAYASAN ASRAMA PELAJAR ISLAM
                    </div>

                    <!-- Info Rows - 2 columns -->
                    <div style="display: flex; margin-bottom: 12px;">
                        <!-- Left Column -->
                        <div style="flex: 1;">
                            <div style="margin-bottom: 3px;">
                                <span style="display: inline-block; width: 90px;">Nomor Surat</span>
                                <span>: ${pengajuan.no_surat || pengajuan.nomor_pengajuan || '-'}</span>
                            </div>
                            <div>
                                <span style="display: inline-block; width: 90px;">Kepada</span>
                                <span>: ${pengajuan.unit?.nama || pengajuan.user?.name || '-'}</span>
                            </div>
                        </div>
                        <!-- Right Column -->
                        <div style="text-align: right; width: 220px; white-space: nowrap;">
                            <div style="margin-bottom: 3px;">
                                <span>Tanggal : ${formatDateIndonesian(today)}</span>
                            </div>
                            <div>
                                <span>Nomor : </span>
                                <span style="font-weight: bold;">${pengajuan.no_voucher || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Full width rows -->
                    <div style="margin-bottom: 12px;">
                        <div style="margin-bottom: 3px;">
                            <span style="display: inline-block; width: 90px;">Perihal</span>
                            <span>: ${pengajuan.perihal || pengajuan.nama_pengajuan || '-'}</span>
                        </div>
                        <div style="margin-bottom: 3px;">
                            <span style="display: inline-block; width: 90px;">Berupa</span>
                            <span>: Cek/Giro/Cash</span>
                        </div>
                        <div style="margin-bottom: 3px;">
                            <span style="display: inline-block; width: 90px;">Uang Sebesar</span>
                            <span>: ${numberToWords(amount)}</span>
                        </div>
                        <div>
                            <span style="display: inline-block; width: 90px;">Rp.</span>
                            <span>: ${formatRupiah(amount)}</span>
                        </div>
                    </div>

                    <!-- Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                        <thead>
                            <tr>
                                <th style="border: 1px dashed #000; padding: 4px 6px; text-align: left; font-weight: bold; background: #f0f0f0;">
                                    Kode Anggaran
                                </th>
                                <th style="border: 1px dashed #000; padding: 4px 6px; text-align: left; font-weight: bold; background: #f0f0f0;">
                                    Sub Mata Anggaran
                                </th>
                                <th style="border: 1px dashed #000; padding: 4px 6px; text-align: right; font-weight: bold; background: #f0f0f0;">
                                    Jumlah (Rp)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <!-- Signature Row -->
                    <div style="display: flex; justify-content: space-between; margin-top: 20px; text-align: center;">
                        <div style="width: 18%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Disetujui</div>
                            <div style="font-size: 9pt;">Tgl.</div>
                        </div>
                        <div style="width: 18%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Diketahui</div>
                            <div style="font-size: 9pt;">Tgl.</div>
                        </div>
                        <div style="width: 18%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Diperiksa</div>
                            <div style="font-size: 9pt;">Tgl.</div>
                        </div>
                        <div style="width: 18%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Diterima</div>
                            <div style="font-size: 9pt;">Tgl.</div>
                        </div>
                        <div style="width: 18%;">
                            <div style="font-weight: bold; margin-bottom: 40px;">Dibukukan</div>
                            <div style="font-size: 9pt;">Tgl.</div>
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
                                    Preview Voucher
                                </h3>
                                <p className="text-sm text-slate-500">
                                    No. Voucher: {pengajuan.no_voucher}
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
                                className="bg-white p-6 border border-dashed border-slate-400"
                                style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt', lineHeight: '1.4' }}
                            >
                                {/* Header */}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: '15px', textTransform: 'uppercase' }}>
                                    BUKTI PENGELUARAN KAS YAYASAN ASRAMA PELAJAR ISLAM
                                </div>

                                {/* Info Rows - 2 columns */}
                                <div style={{ display: 'flex', marginBottom: '12px' }}>
                                    {/* Left Column */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '3px' }}>
                                            <span style={{ display: 'inline-block', width: '90px' }}>Nomor Surat</span>
                                            <span>: {pengajuan.no_surat || pengajuan.nomor_pengajuan || '-'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'inline-block', width: '90px' }}>Kepada</span>
                                            <span>: {pengajuan.unit?.nama || pengajuan.user?.name || '-'}</span>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div style={{ textAlign: 'right', width: '220px', whiteSpace: 'nowrap' }}>
                                        <div style={{ marginBottom: '3px' }}>
                                            <span>Tanggal : {formatDateIndonesian(today)}</span>
                                        </div>
                                        <div>
                                            <span>Nomor : </span>
                                            <span style={{ fontWeight: 'bold' }}>{pengajuan.no_voucher || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Full width rows */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ marginBottom: '3px' }}>
                                        <span style={{ display: 'inline-block', width: '90px' }}>Perihal</span>
                                        <span>: {pengajuan.perihal || pengajuan.nama_pengajuan || '-'}</span>
                                    </div>
                                    <div style={{ marginBottom: '3px' }}>
                                        <span style={{ display: 'inline-block', width: '90px' }}>Berupa</span>
                                        <span>: Cek/Giro/Cash</span>
                                    </div>
                                    <div style={{ marginBottom: '3px' }}>
                                        <span style={{ display: 'inline-block', width: '90px' }}>Uang Sebesar</span>
                                        <span>: {numberToWords(amount)}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'inline-block', width: '90px' }}>Rp.</span>
                                        <span>: {formatRupiah(amount)}</span>
                                    </div>
                                </div>

                                {/* Table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px dashed #64748b', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', background: '#f1f5f9' }}>
                                                Kode Anggaran
                                            </th>
                                            <th style={{ border: '1px dashed #64748b', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', background: '#f1f5f9' }}>
                                                Sub Mata Anggaran
                                            </th>
                                            <th style={{ border: '1px dashed #64748b', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', background: '#f1f5f9' }}>
                                                Jumlah (Rp)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailRows.map((row, index) => (
                                            <tr key={index}>
                                                <td style={{ border: '1px dashed #64748b', padding: '4px 6px' }}>
                                                    {row.kode}
                                                </td>
                                                <td style={{ border: '1px dashed #64748b', padding: '4px 6px' }}>
                                                    {row.nama}
                                                </td>
                                                <td style={{ border: '1px dashed #64748b', padding: '4px 6px', textAlign: 'right' }}>
                                                    {formatRupiah(row.jumlah)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Signature Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', textAlign: 'center' }}>
                                    <div style={{ width: '18%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Disetujui</div>
                                        <div style={{ fontSize: '9pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '18%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Diketahui</div>
                                        <div style={{ fontSize: '9pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '18%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Diperiksa</div>
                                        <div style={{ fontSize: '9pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '18%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Diterima</div>
                                        <div style={{ fontSize: '9pt' }}>Tgl.</div>
                                    </div>
                                    <div style={{ width: '18%' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Dibukukan</div>
                                        <div style={{ fontSize: '9pt' }}>Tgl.</div>
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
                                {isPrinting ? 'Mencetak...' : 'Print Voucher'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
