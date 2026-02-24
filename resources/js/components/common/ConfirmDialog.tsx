import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

type Variant = 'default' | 'destructive' | 'approve' | 'revise';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    onConfirm: () => void;
    isLoading?: boolean;
    children?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
    default:
        'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    destructive:
        'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    approve:
        'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
    revise:
        'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500',
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    variant = 'default',
    onConfirm,
    isLoading = false,
    children,
}: ConfirmDialogProps) {
    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onOpenChange(false);
            }
        },
        [onOpenChange, isLoading],
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
                        onClick={() => {
                            if (!isLoading) onOpenChange(false);
                        }}
                    />

                    {/* Dialog card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        aria-describedby="confirm-dialog-description"
                        className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                            <h2
                                id="confirm-dialog-title"
                                className="text-base font-semibold text-slate-900"
                            >
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isLoading) onOpenChange(false);
                                }}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4">
                            <p
                                id="confirm-dialog-description"
                                className="text-sm text-slate-600"
                            >
                                {description}
                            </p>
                            {children && <div className="mt-4">{children}</div>}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isLoading) onOpenChange(false);
                                }}
                                disabled={isLoading}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70',
                                    variantStyles[variant],
                                )}
                            >
                                {isLoading && <LoadingSpinner size="sm" className="border-white border-t-transparent" />}
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
