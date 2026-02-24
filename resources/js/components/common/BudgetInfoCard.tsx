import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetInfoCardProps {
    nama: string;
    kode?: string;
    anggaranAwal: number;
    saldoDigunakan: number;
    saldoTersedia: number;
    jumlahDiminta: number;
    compact?: boolean;
    className?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function BudgetInfoCard({
    nama,
    kode,
    anggaranAwal,
    saldoDigunakan,
    saldoTersedia,
    jumlahDiminta,
    compact = false,
    className,
}: BudgetInfoCardProps) {
    const usedPercentage = anggaranAwal > 0 ? (saldoDigunakan / anggaranAwal) * 100 : 0;
    const isSufficient = saldoTersedia >= jumlahDiminta;
    const kekurangan = jumlahDiminta - saldoTersedia;

    if (compact) {
        return (
            <div className={cn('rounded-md border p-3', className, !isSufficient && 'border-amber-300 bg-amber-50')}>
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">
                            {kode && <span className="text-slate-400">{kode} - </span>}
                            {nama}
                        </p>
                        <p className="text-xs text-slate-500">
                            Sisa: {formatCurrency(saldoTersedia)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isSufficient ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </div>
                </div>
                {!isSufficient && (
                    <p className="mt-1.5 text-xs text-amber-600">
                        Kurang: {formatCurrency(kekurangan)}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={cn('rounded-lg border bg-white shadow-sm', className)}>
            {/* Header */}
            <div className="border-b border-slate-100 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-800">
                    Informasi Anggaran
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                    {kode && <span className="font-medium">{kode}</span>}
                    {kode && ' - '}
                    {nama}
                </p>
            </div>

            {/* Body */}
            <div className="space-y-3 p-4">
                {/* Budget breakdown */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Pagu Awal</span>
                        <span className="font-medium text-slate-700">
                            {formatCurrency(anggaranAwal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sudah Dipakai</span>
                        <span className="font-medium text-slate-700">
                            {formatCurrency(saldoDigunakan)}
                            <span className="ml-1 text-xs text-slate-400">
                                ({usedPercentage.toFixed(0)}%)
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sisa Tersedia</span>
                        <span className={cn(
                            'font-semibold',
                            saldoTersedia > 0 ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {formatCurrency(saldoTersedia)}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                usedPercentage >= 90 ? 'bg-red-500' :
                                usedPercentage >= 70 ? 'bg-amber-500' :
                                'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-right text-xs text-slate-400">
                        {usedPercentage.toFixed(1)}% terpakai
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Pengajuan Anda</span>
                        <span className={cn(
                            'text-sm font-semibold',
                            isSufficient ? 'text-slate-700' : 'text-red-600'
                        )}>
                            {formatCurrency(jumlahDiminta)}
                        </span>
                    </div>

                    {/* Status */}
                    <div className={cn(
                        'mt-3 flex items-center gap-2 rounded-md px-3 py-2',
                        isSufficient ? 'bg-emerald-50' : 'bg-red-50'
                    )}>
                        {isSufficient ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-700">
                                    Saldo Mencukupi
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <div>
                                    <span className="text-sm font-medium text-red-700">
                                        Saldo Tidak Mencukupi
                                    </span>
                                    <p className="text-xs text-red-600">
                                        Kekurangan: {formatCurrency(kekurangan)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
