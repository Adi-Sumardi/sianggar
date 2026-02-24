import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Reply, ArrowRight } from 'lucide-react';

interface EmailReminderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unreadEmailCount: number;
    unreadReplyCount: number;
}

export function EmailReminderModal({
    open,
    onOpenChange,
    unreadEmailCount,
    unreadReplyCount,
}: EmailReminderModalProps) {
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

    const handleGoToInbox = () => {
        onOpenChange(false);
        navigate('/emails');
    };

    const hasNotifications = unreadEmailCount > 0 || unreadReplyCount > 0;

    if (!hasNotifications) return null;

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
                        aria-labelledby="email-reminder-title"
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

                        {/* Header with mail icon */}
                        <div className="flex flex-col items-center px-6 pt-8 pb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <Mail className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2
                                id="email-reminder-title"
                                className="mt-4 text-lg font-semibold text-slate-900"
                            >
                                Anda Memiliki Surat Baru!
                            </h2>
                            <p className="mt-1 text-center text-sm text-slate-500">
                                Ada surat atau balasan yang belum dibaca
                            </p>
                        </div>

                        {/* Body - Cards */}
                        <div className="space-y-3 px-6 pb-4">
                            {/* New Emails */}
                            {unreadEmailCount > 0 && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                                <Mail className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">
                                                    Surat Masuk Baru
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    {unreadEmailCount} surat belum dibaca
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGoToInbox}
                                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                            Lihat
                                            <ArrowRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* New Replies */}
                            {unreadReplyCount > 0 && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                                <Reply className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    Balasan Surat Baru
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {unreadReplyCount} balasan belum dibaca
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGoToInbox}
                                            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                                        >
                                            Lihat
                                            <ArrowRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
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
