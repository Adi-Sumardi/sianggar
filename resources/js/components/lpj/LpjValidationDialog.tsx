import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, FileText, ClipboardList, Receipt, Calculator, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ReferenceType, getReferenceTypeLabel } from '@/types/enums';
import type { ValidateLpjDTO } from '@/types/api';

interface LpjValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (dto: ValidateLpjDTO) => void;
    isLoading?: boolean;
}

interface ChecklistItem {
    key: keyof Pick<ValidateLpjDTO, 'has_activity_identity' | 'has_cover_letter' | 'has_narrative_report' | 'has_financial_report' | 'has_receipts'>;
    label: string;
    icon: React.ReactNode;
}

const checklistItems: ChecklistItem[] = [
    {
        key: 'has_activity_identity',
        label: 'Identitas kegiatan',
        icon: <FileText className="h-4 w-4" />,
    },
    {
        key: 'has_cover_letter',
        label: 'Surat pengantar LPJ (ditandatangani Kepala Unit/Kepsek)',
        icon: <ClipboardList className="h-4 w-4" />,
    },
    {
        key: 'has_narrative_report',
        label: 'Laporan naratif capaian kegiatan',
        icon: <BookOpen className="h-4 w-4" />,
    },
    {
        key: 'has_financial_report',
        label: 'Laporan keuangan',
        icon: <Calculator className="h-4 w-4" />,
    },
    {
        key: 'has_receipts',
        label: 'Kuitansi atau bukti-bukti pengeluaran',
        icon: <Receipt className="h-4 w-4" />,
    },
];

const referenceOptions = [
    { value: ReferenceType.Education, label: getReferenceTypeLabel(ReferenceType.Education) },
    { value: ReferenceType.HrGeneral, label: getReferenceTypeLabel(ReferenceType.HrGeneral) },
    { value: ReferenceType.Secretariat, label: getReferenceTypeLabel(ReferenceType.Secretariat) },
];

export function LpjValidationDialog({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: LpjValidationDialogProps) {
    const [formData, setFormData] = useState<ValidateLpjDTO>({
        has_activity_identity: false,
        has_cover_letter: false,
        has_narrative_report: false,
        has_financial_report: false,
        has_receipts: false,
        reference_type: '',
        notes: '',
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                has_activity_identity: false,
                has_cover_letter: false,
                has_narrative_report: false,
                has_financial_report: false,
                has_receipts: false,
                reference_type: '',
                notes: '',
            });
        }
    }, [open]);

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

    const handleCheckboxChange = (key: ChecklistItem['key']) => {
        setFormData((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
    };

    const allChecked = checklistItems.every((item) => formData[item.key]);
    const hasReferenceType = formData.reference_type !== '';
    const canSubmit = allChecked && hasReferenceType;

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
                        aria-labelledby="validation-dialog-title"
                        className="relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2
                                    id="validation-dialog-title"
                                    className="text-base font-semibold text-slate-900"
                                >
                                    Validasi LPJ
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Periksa kelengkapan dokumen sebelum menyetujui
                                </p>
                            </div>
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
                        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                            {/* Checklist Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-700">
                                    Checklist Kelengkapan Dokumen
                                </h3>
                                <div className="space-y-2">
                                    {checklistItems.map((item) => (
                                        <label
                                            key={item.key}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                                                formData[item.key]
                                                    ? 'border-emerald-200 bg-emerald-50'
                                                    : 'border-slate-200 hover:bg-slate-50',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData[item.key]}
                                                onChange={() => handleCheckboxChange(item.key)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={cn(
                                                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                                                    formData[item.key]
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-slate-300',
                                                )}
                                            >
                                                {formData[item.key] && (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex items-center gap-2 text-sm',
                                                    formData[item.key]
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600',
                                                )}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Reference Type Section */}
                            <div className="mt-5 space-y-3">
                                <h3 className="text-sm font-medium text-slate-700">
                                    Rujukan LPJ <span className="text-red-500">*</span>
                                </h3>
                                <div className="space-y-2">
                                    {referenceOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                                                formData.reference_type === option.value
                                                    ? 'border-blue-200 bg-blue-50'
                                                    : 'border-slate-200 hover:bg-slate-50',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="reference_type"
                                                value={option.value}
                                                checked={formData.reference_type === option.value}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        reference_type: e.target.value,
                                                    }))
                                                }
                                                className="sr-only"
                                            />
                                            <div
                                                className={cn(
                                                    'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                                                    formData.reference_type === option.value
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-slate-300',
                                                )}
                                            >
                                                {formData.reference_type === option.value && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-sm',
                                                    formData.reference_type === option.value
                                                        ? 'text-blue-700 font-medium'
                                                        : 'text-slate-600',
                                                )}
                                            >
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="mt-5 space-y-2">
                                <label
                                    htmlFor="validation-notes"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Catatan (opsional)
                                </label>
                                <textarea
                                    id="validation-notes"
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            notes: e.target.value,
                                        }))
                                    }
                                    placeholder="Tambahkan catatan jika diperlukan..."
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                            <p className="text-xs text-slate-500">
                                {allChecked && hasReferenceType
                                    ? 'Semua syarat terpenuhi'
                                    : !allChecked
                                      ? 'Centang semua checklist'
                                      : 'Pilih rujukan LPJ'}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isLoading) onOpenChange(false);
                                    }}
                                    disabled={isLoading}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading || !canSubmit}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                        canSubmit
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500'
                                            : 'cursor-not-allowed bg-slate-300 text-slate-500',
                                    )}
                                >
                                    {isLoading && (
                                        <LoadingSpinner
                                            size="sm"
                                            className="border-white border-t-transparent"
                                        />
                                    )}
                                    Validasi & Setujui
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
