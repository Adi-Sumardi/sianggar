import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeftRight, Phone, ArrowLeft } from 'lucide-react';
import type { BudgetCheckResultItem } from '@/types/api';

interface InsufficientBudgetModalProps {
    open: boolean;
    onClose: () => void;
    insufficientItems: BudgetCheckResultItem[];
    onRequestTransfer?: () => void;
    onContactFinance?: () => void;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function InsufficientBudgetModal({
    open,
    onClose,
    insufficientItems,
    onRequestTransfer,
    onContactFinance,
}: InsufficientBudgetModalProps) {
    const totalKekurangan = insufficientItems.reduce((sum, item) => sum + item.kekurangan, 0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-center">
                        Saldo Anggaran Tidak Mencukupi
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Beberapa item pengajuan melebihi saldo anggaran yang tersedia.
                    </DialogDescription>
                </DialogHeader>

                {/* List of insufficient items */}
                <div className="max-h-64 space-y-3 overflow-y-auto">
                    {insufficientItems.map((item, index) => (
                        <div
                            key={item.detail_mata_anggaran_id}
                            className="rounded-lg border border-red-200 bg-red-50 p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800">
                                        {index + 1}. {item.nama}
                                    </p>
                                    {item.kode && (
                                        <p className="text-xs text-slate-500">{item.kode}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <p className="text-slate-500">Saldo</p>
                                    <p className="font-medium text-slate-700">
                                        {formatCurrency(item.saldo_tersedia)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Diminta</p>
                                    <p className="font-medium text-slate-700">
                                        {formatCurrency(item.jumlah_diminta)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Kekurangan</p>
                                    <p className="font-semibold text-red-600">
                                        {formatCurrency(item.kekurangan)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total shortage */}
                <div className="rounded-lg bg-slate-100 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">
                            Total Kekurangan
                        </span>
                        <span className="text-lg font-bold text-red-600">
                            {formatCurrency(totalKekurangan)}
                        </span>
                    </div>
                </div>

                {/* Action options */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Pilih tindakan:</p>

                    {onRequestTransfer && (
                        <button
                            onClick={onRequestTransfer}
                            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    Ajukan Geser Anggaran
                                </p>
                                <p className="text-xs text-slate-500">
                                    Pindahkan saldo dari pos anggaran lain
                                </p>
                            </div>
                        </button>
                    )}

                    {onContactFinance && (
                        <button
                            onClick={onContactFinance}
                            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                <Phone className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    Hubungi Tim Keuangan
                                </p>
                                <p className="text-xs text-slate-500">
                                    Konsultasikan untuk mendapatkan solusi
                                </p>
                            </div>
                        </button>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali Edit Pengajuan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
