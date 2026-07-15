import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, User, Clock, ChevronRight, Inbox, Loader2, AlertCircle, Printer } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LpjVoucherModal } from '@/components/common/LpjVoucherModal';
import { formatRupiah } from '@/lib/currency';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useApprovalQueue } from '@/hooks/useApprovals';
import { useLpjPrintQueue, usePrintLpj } from '@/hooks/useApprovals';
import type { PengajuanAnggaran, Lpj } from '@/types/models';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyQueue({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 mb-4">
                <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
                Tidak ada antrian
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                {message}
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Pengajuan queue card
// ---------------------------------------------------------------------------

function PengajuanQueueCard({ item, onClick, index }: { item: PengajuanAnggaran; onClick: () => void; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 mb-1">
                        Pengajuan
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.perihal || item.nama_pengajuan}
                    </h3>
                    <p className="mt-0.5 text-sm text-blue-600 font-medium">
                        {item.nomor_pengajuan}
                    </p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(item.approved_amount || item.jumlah_pengajuan_total)}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{item.unit?.nama || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{item.user?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(item.created_at)}</span>
                </div>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5 text-blue-500" />
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// LPJ queue card
// ---------------------------------------------------------------------------

function LpjQueueCard({ item, onClick, index }: { item: Lpj; onClick: () => void; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 mb-1">
                        LPJ
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {item.perihal}
                    </h3>
                    <p className="mt-0.5 text-sm text-purple-600 font-medium">
                        {item.no_surat || '-'}
                    </p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(item.input_realisasi || 0)}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{item.pengajuan_anggaran?.unit?.nama || item.unit || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{item.pengajuan_anggaran?.user?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(item.created_at)}</span>
                </div>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Printer className="h-5 w-5 text-purple-500" />
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AntrianCetak() {
    const navigate = useNavigate();
    const [printTarget, setPrintTarget] = useState<Lpj | null>(null);

    const {
        data: pengajuanResponse,
        isLoading: isPengajuanLoading,
        isError: isPengajuanError,
    } = useApprovalQueue({ page: 1, per_page: 100 });

    const {
        data: lpjQueue = [],
        isLoading: isLpjLoading,
        isError: isLpjError,
    } = useLpjPrintQueue();

    const printLpjMutation = usePrintLpj();

    const pengajuanData = pengajuanResponse?.data ?? [];

    const handlePengajuanClick = (item: PengajuanAnggaran) => {
        navigate(`/approvals/${item.ulid ?? item.id}?type=pengajuan`);
    };

    const handleLpjClick = (item: Lpj) => {
        setPrintTarget(item);
    };

    const handlePrintLpj = () => {
        if (!printTarget) return;
        const target = printTarget;
        printLpjMutation.mutate(target.ulid ?? target.id, {
            onSuccess: () => setPrintTarget(null),
        });
    };

    const isLoading = isPengajuanLoading || isLpjLoading;
    const isError = isPengajuanError || isLpjError;

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (isError) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-sm text-red-600">Gagal memuat data antrian cetak</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Antrian Cetak"
                        description="Cetak voucher pengajuan dan bukti LPJ yang sudah disetujui"
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <Tabs defaultValue="pengajuan" className="w-full">
                        <TabsList>
                            <TabsTrigger value="pengajuan">
                                Cetak Pengajuan
                                <span className={cn(
                                    'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-bold text-slate-600',
                                )}>
                                    {pengajuanData.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="lpj">
                                Cetak LPJ
                                <span className={cn(
                                    'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-bold text-slate-600',
                                )}>
                                    {lpjQueue.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pengajuan" className="mt-6">
                            {pengajuanData.length === 0 ? (
                                <EmptyQueue message="Semua voucher pengajuan sudah dicetak." />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {pengajuanData.map((item, index) => (
                                        <PengajuanQueueCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => handlePengajuanClick(item)}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="lpj" className="mt-6">
                            {lpjQueue.length === 0 ? (
                                <EmptyQueue message="Semua bukti LPJ sudah dicetak." />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {lpjQueue.map((item, index) => (
                                        <LpjQueueCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => handleLpjClick(item)}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </motion.div>

            {printTarget && (
                <LpjVoucherModal
                    lpj={printTarget}
                    open={!!printTarget}
                    onClose={() => setPrintTarget(null)}
                    onPrint={handlePrintLpj}
                    isPrinting={printLpjMutation.isPending}
                />
            )}
        </PageTransition>
    );
}
