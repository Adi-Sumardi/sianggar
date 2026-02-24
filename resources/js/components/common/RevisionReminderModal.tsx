import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, FileEdit, ClipboardList, BarChart3, XCircle, ArrowRight } from 'lucide-react';

interface RevisionReminderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    revisedPengajuanCount: number;
    revisedLpjCount: number;
    revisedRapbsCount: number;
    rejectedPengajuanCount: number;
    rejectedLpjCount: number;
    rejectedRapbsCount: number;
}

export function RevisionReminderModal({
    open,
    onOpenChange,
    revisedPengajuanCount,
    revisedLpjCount,
    revisedRapbsCount,
    rejectedPengajuanCount,
    rejectedLpjCount,
    rejectedRapbsCount,
}: RevisionReminderModalProps) {
    const navigate = useNavigate();

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
            }
        },
        [onOpenChange],
    );

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    const handleClose = () => {
        onOpenChange(false);
    };

    const goTo = (path: string) => {
        onOpenChange(false);
        navigate(path);
    };

    const totalRevisions = revisedPengajuanCount + revisedLpjCount + revisedRapbsCount;
    const totalRejected = rejectedPengajuanCount + rejectedLpjCount + rejectedRapbsCount;
    const hasItems = totalRevisions > 0 || totalRejected > 0;

    if (!hasItems) return null;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/40"
                        onClick={handleClose}
                    />

                    {/* Dialog card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="revision-reminder-title"
                        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute right-4 top-4 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Tutup"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header with warning icon */}
                        <div className="flex flex-col items-center px-6 pt-8 pb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                                <AlertTriangle className="h-8 w-8 text-amber-600" />
                            </div>
                            <h2
                                id="revision-reminder-title"
                                className="mt-4 text-lg font-semibold text-slate-900"
                            >
                                Ada yang Perlu Ditindaklanjuti!
                            </h2>
                            <p className="mt-1 text-center text-sm text-slate-500">
                                Beberapa item memerlukan perhatian Anda segera
                            </p>
                        </div>

                        {/* Body - Cards */}
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 pb-4">
                            {/* === Perlu Revisi Section === */}
                            {totalRevisions > 0 && (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Perlu Revisi
                                    </p>

                                    {/* Pengajuan Perlu Revisi */}
                                    {revisedPengajuanCount > 0 && (
                                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                                        <FileEdit className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-orange-800">
                                                            Pengajuan
                                                        </p>
                                                        <p className="text-xs text-orange-600">
                                                            {revisedPengajuanCount} menunggu perbaikan
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/pengajuan?status=revision-required')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* LPJ Perlu Revisi */}
                                    {revisedLpjCount > 0 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                                        <ClipboardList className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">
                                                            LPJ
                                                        </p>
                                                        <p className="text-xs text-amber-600">
                                                            {revisedLpjCount} menunggu perbaikan
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/lpj?status=revised')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* RAPBS Ditolak (perlu revisi/resubmit) */}
                                    {revisedRapbsCount > 0 && (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                                                        <BarChart3 className="h-5 w-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-yellow-800">
                                                            RAPBS
                                                        </p>
                                                        <p className="text-xs text-yellow-600">
                                                            {revisedRapbsCount} perlu ditinjau ulang
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/planning/rapbs')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-yellow-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* === Ditolak Section === */}
                            {totalRejected > 0 && (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Ditolak
                                    </p>

                                    {/* Pengajuan Ditolak */}
                                    {rejectedPengajuanCount > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800">
                                                            Pengajuan
                                                        </p>
                                                        <p className="text-xs text-red-600">
                                                            {rejectedPengajuanCount} pengajuan ditolak
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/pengajuan?status=rejected')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* LPJ Ditolak */}
                                    {rejectedLpjCount > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800">
                                                            LPJ
                                                        </p>
                                                        <p className="text-xs text-red-600">
                                                            {rejectedLpjCount} LPJ ditolak
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/lpj?status=rejected')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* RAPBS Ditolak */}
                                    {rejectedRapbsCount > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800">
                                                            RAPBS
                                                        </p>
                                                        <p className="text-xs text-red-600">
                                                            {rejectedRapbsCount} RAPBS ditolak
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => goTo('/planning/rapbs')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                                >
                                                    Lihat
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Nanti Saja
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
