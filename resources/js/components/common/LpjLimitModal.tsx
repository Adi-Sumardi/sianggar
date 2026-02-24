import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ClipboardList } from 'lucide-react';

interface LpjLimitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingCount: number;
    maxLimit: number;
}

export function LpjLimitModal({
    open,
    onOpenChange,
    pendingCount,
    maxLimit,
}: LpjLimitModalProps) {
    const navigate = useNavigate();

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
                navigate('/lpj');
            }
        },
        [onOpenChange, navigate],
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
        navigate('/lpj');
    };

    const handleGoToLpj = () => {
        onOpenChange(false);
        navigate('/lpj/create');
    };

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
                        aria-labelledby="lpj-limit-dialog-title"
                        aria-describedby="lpj-limit-dialog-description"
                        className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                        {/* Header with warning icon */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                </div>
                                <h2
                                    id="lpj-limit-dialog-title"
                                    className="text-base font-semibold text-slate-900"
                                >
                                    Tidak Dapat Membuat Pengajuan Baru
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4">
                            <p
                                id="lpj-limit-dialog-description"
                                className="text-sm text-slate-600"
                            >
                                Anda memiliki <span className="font-bold text-amber-600">{pendingCount}</span> pengajuan
                                yang belum dibuat LPJ-nya. Batas maksimal adalah {maxLimit} pengajuan.
                            </p>
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm text-amber-800">
                                    Untuk dapat membuat pengajuan baru, Anda harus menyelesaikan
                                    Laporan Pertanggungjawaban (LPJ) untuk pengajuan yang sudah dibayar terlebih dahulu.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToLpj}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                            >
                                <ClipboardList className="h-4 w-4" />
                                Buat LPJ
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
