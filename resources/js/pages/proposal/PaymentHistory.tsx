import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Printer, Search, Loader2, Clock, User, X, CheckCircle2, Building2, FileText } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRupiah } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { usePaymentHistory } from '@/hooks/useApprovals';
import type { PengajuanAnggaran } from '@/types/models';

// ---------------------------------------------------------------------------
// Number to words converter (Indonesian)
// ---------------------------------------------------------------------------

function numberToWords(num: number): string {
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    if (num < 12) return units[num];
    if (num < 20) return units[num - 10] + ' belas';
    if (num < 100) return units[Math.floor(num / 10)] + ' puluh ' + units[num % 10];
    if (num < 200) return 'seratus ' + numberToWords(num - 100);
    if (num < 1000) return units[Math.floor(num / 100)] + ' ratus ' + numberToWords(num % 100);
    if (num < 2000) return 'seribu ' + numberToWords(num - 1000);
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' ribu ' + numberToWords(num % 1000);
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' juta ' + numberToWords(num % 1000000);
    if (num < 1000000000000) return numberToWords(Math.floor(num / 1000000000)) + ' miliar ' + numberToWords(num % 1000000000);
    return numberToWords(Math.floor(num / 1000000000000)) + ' triliun ' + numberToWords(num % 1000000000000);
}

function terbilang(amount: number): string {
    if (amount === 0) return 'nol rupiah';
    const words = numberToWords(Math.floor(amount)).trim().replace(/\s+/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1) + ' rupiah';
}

// ---------------------------------------------------------------------------
// Payment Receipt Modal
// ---------------------------------------------------------------------------

interface PaymentReceiptModalProps {
    payment: PengajuanAnggaran | null;
    onClose: () => void;
}

function PaymentReceiptModal({ payment, onClose }: PaymentReceiptModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!payment) return null;

    const amount = payment.approved_amount || payment.jumlah_pengajuan_total;
    const paidDate = payment.paid_at ? new Date(payment.paid_at) : new Date();

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Quarter A4 size: ~105mm x 148mm
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bukti Pembayaran - ${payment.no_voucher}</title>
                <style>
                    @page { size: 105mm 148mm; margin: 5mm; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 8pt;
                        line-height: 1.3;
                        color: #1a1a1a;
                    }
                    .receipt {
                        width: 95mm;
                        margin: 0 auto;
                        padding: 3mm;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 1px solid #333;
                        padding-bottom: 4px;
                        margin-bottom: 6px;
                    }
                    .org-name {
                        font-size: 10pt;
                        font-weight: bold;
                        color: #1e3a5f;
                        text-transform: uppercase;
                    }
                    .org-address {
                        font-size: 6pt;
                        color: #666;
                        margin-top: 2px;
                    }
                    .title {
                        font-size: 9pt;
                        font-weight: bold;
                        text-align: center;
                        margin: 6px 0 4px;
                        padding: 3px 0;
                        background: #1e3a5f;
                        color: white;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .voucher-no {
                        text-align: center;
                        font-size: 8pt;
                        font-weight: bold;
                        color: #1e3a5f;
                        margin-bottom: 6px;
                    }
                    .info-row {
                        display: flex;
                        font-size: 7pt;
                        margin-bottom: 2px;
                    }
                    .info-label {
                        width: 55px;
                        flex-shrink: 0;
                    }
                    .info-colon {
                        width: 8px;
                        flex-shrink: 0;
                    }
                    .info-value {
                        flex: 1;
                    }
                    .divider {
                        border-top: 1px dashed #999;
                        margin: 6px 0;
                    }
                    .amount-box {
                        background: #f0f0f0;
                        border: 1px solid #1e3a5f;
                        padding: 6px;
                        margin: 6px 0;
                        text-align: center;
                    }
                    .amount-label {
                        font-size: 6pt;
                        color: #666;
                        text-transform: uppercase;
                    }
                    .amount-value {
                        font-size: 14pt;
                        font-weight: bold;
                        color: #1e3a5f;
                        margin: 3px 0;
                    }
                    .amount-words {
                        font-size: 6pt;
                        font-style: italic;
                        color: #666;
                    }
                    .status-badge {
                        display: inline-block;
                        background: #10b981;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 7pt;
                        font-weight: bold;
                    }
                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 10px;
                        font-size: 6pt;
                    }
                    .signature-box {
                        text-align: center;
                        width: 40mm;
                    }
                    .signature-line {
                        border-bottom: 1px solid #333;
                        height: 25px;
                        margin: 2px 0;
                    }
                    .signature-name {
                        font-weight: bold;
                        font-size: 7pt;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 8px;
                        padding-top: 4px;
                        border-top: 1px solid #ddd;
                        font-size: 5pt;
                        color: #999;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="org-name">Yayasan Asrama Pelajar Islam</div>
                        <div class="org-address">Jakarta Selatan</div>
                    </div>

                    <div class="title">Bukti Pembayaran</div>
                    <div class="voucher-no">${payment.no_voucher || '-'}</div>

                    <div class="info-row">
                        <span class="info-label">Tanggal</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${paidDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${paidDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Pengajuan</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${payment.nomor_pengajuan || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Perihal</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${payment.perihal || payment.nama_pengajuan || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Metode</span>
                        <span class="info-colon">:</span>
                        <span class="info-value" style="text-transform: capitalize">${payment.payment_method || 'Transfer Bank'}</span>
                    </div>

                    <div class="divider"></div>

                    <div class="info-row">
                        <span class="info-label">Penerima</span>
                        <span class="info-colon">:</span>
                        <span class="info-value"><strong>${payment.payment_recipient || '-'}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Pengaju</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${payment.user?.name || '-'}</span>
                    </div>
                    ${payment.payment_notes ? `
                    <div class="info-row">
                        <span class="info-label">Catatan</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${payment.payment_notes}</span>
                    </div>
                    ` : ''}

                    <div class="amount-box">
                        <div class="amount-label">Jumlah Dibayar</div>
                        <div class="amount-value">${formatRupiah(amount)}</div>
                        <div class="amount-words">${terbilang(Number(amount))}</div>
                    </div>

                    <div style="text-align: center; margin: 6px 0;">
                        <span class="status-badge">LUNAS</span>
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            <div>Penerima,</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">${payment.payment_recipient || '............'}</div>
                        </div>
                        <div class="signature-box">
                            <div>Petugas,</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">${payment.paid_by?.name || '............'}</div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
                        <p>SIANGGAR</p>
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                        <div className="flex items-center gap-3 text-white">
                            <FileText className="h-6 w-6" />
                            <div>
                                <h3 className="text-lg font-semibold">Bukti Pembayaran</h3>
                                <p className="text-sm text-emerald-100">{payment.no_voucher}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div ref={printRef} className="max-h-[calc(90vh-140px)] overflow-auto p-6">
                        {/* Status Badge */}
                        <div className="mb-6 flex items-center justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-semibold">PEMBAYARAN LUNAS</span>
                            </div>
                        </div>

                        {/* Organization Header */}
                        <div className="mb-6 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <Building2 className="h-8 w-8 text-blue-800" />
                                <h2 className="text-xl font-bold text-blue-800">YAYASAN ASRAMA PELAJAR ISLAM</h2>
                            </div>
                            <p className="text-sm text-slate-500">Jakarta Selatan</p>
                        </div>

                        {/* Payment Info Grid */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase text-slate-500">No. Voucher</p>
                                <p className="text-lg font-bold text-blue-600">{payment.no_voucher || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase text-slate-500">Tanggal Bayar</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {formatDate(payment.paid_at || '')}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {payment.paid_at ? new Date(payment.paid_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''} WIB
                                </p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="mb-6 space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Perihal</span>
                                <span className="font-medium text-slate-900">{payment.perihal || payment.nama_pengajuan}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">No. Pengajuan</span>
                                <span className="font-medium text-slate-900">{payment.nomor_pengajuan}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Dibayarkan Kepada</span>
                                <span className="font-semibold text-slate-900">{payment.payment_recipient || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Metode Pembayaran</span>
                                <span className="font-medium capitalize text-slate-900">{payment.payment_method || 'Transfer Bank'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Pengaju</span>
                                <span className="font-medium text-slate-900">{payment.user?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Petugas Payment</span>
                                <span className="font-medium text-slate-900">{payment.paid_by?.name || '-'}</span>
                            </div>
                            {payment.payment_notes && (
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Catatan</span>
                                    <span className="font-medium text-slate-900 text-right max-w-[60%]">{payment.payment_notes}</span>
                                </div>
                            )}
                        </div>

                        {/* Amount Box */}
                        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white">
                            <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">Jumlah Pembayaran</p>
                            <p className="mt-2 text-3xl font-bold">{formatRupiah(amount)}</p>
                            <p className="mt-2 text-sm italic text-emerald-100">
                                {terbilang(Number(amount))}
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak Bukti Pembayaran
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PaymentHistory() {
    const [search, setSearch] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PengajuanAnggaran | null>(null);

    const { data: payments = [], isLoading, isError, error } = usePaymentHistory();

    // Filter payments based on search
    const filteredPayments = payments.filter((item: PengajuanAnggaran) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        return (
            item.perihal?.toLowerCase().includes(searchLower) ||
            item.nomor_pengajuan?.toLowerCase().includes(searchLower) ||
            item.no_voucher?.toLowerCase().includes(searchLower) ||
            item.payment_recipient?.toLowerCase().includes(searchLower) ||
            item.user?.name?.toLowerCase().includes(searchLower)
        );
    });

    // Loading state
    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    // Error state
    if (isError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Gagal memuat data riwayat pembayaran'}
                    </p>
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
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Riwayat Pembayaran"
                        description="Daftar pengajuan anggaran yang sudah dibayarkan"
                    />
                </motion.div>

                {/* Search */}
                <motion.div variants={staggerItem} className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama, voucher, atau penerima..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </motion.div>

                {/* Payment list */}
                <motion.div variants={staggerItem}>
                    {filteredPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                            <Wallet className="mb-4 h-12 w-12 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                {search.trim() ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat pembayaran'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                {search.trim()
                                    ? 'Coba kata kunci lain'
                                    : 'Pembayaran yang sudah diproses akan muncul di sini'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                            No. Voucher
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                            Pengajuan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                            Penerima
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                                            Nominal
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                            Waktu Bayar
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPayments.map((item: PengajuanAnggaran) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-medium text-blue-600">
                                                    {item.no_voucher || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {item.perihal || item.nama_pengajuan}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {item.nomor_pengajuan}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="font-medium text-slate-700">
                                                            {item.payment_recipient || '-'}
                                                        </p>
                                                        {item.payment_method && (
                                                            <p className="text-xs text-slate-400 capitalize">
                                                                {item.payment_method}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-medium text-emerald-600">
                                                    {formatRupiah(item.approved_amount || item.jumlah_pengajuan_total)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-slate-700">
                                                            {item.paid_at ? formatDate(item.paid_at) : '-'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {item.paid_at ? new Date(item.paid_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={item.status_proses} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment(item)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                                    title="Cetak Bukti Pembayaran"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    Cetak
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Payment Receipt Modal */}
            {selectedPayment && (
                <PaymentReceiptModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                />
            )}
        </PageTransition>
    );
}
