import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ImportResult } from '@/types/api';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    templateUrl: string;
    templateFileName: string;
    onImport: (file: File) => Promise<ImportResult>;
    onSuccess?: () => void;
}

export function ImportDialog({
    open,
    onOpenChange,
    title,
    templateUrl,
    templateFileName,
    onImport,
    onSuccess,
}: ImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setFile(null);
            setResult(null);
            setError(null);
            setIsUploading(false);
        }
    }, [open]);

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isUploading) {
                onOpenChange(false);
            }
        },
        [onOpenChange, isUploading],
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setResult(null);

        try {
            const importResult = await onImport(file);
            setResult(importResult);
            if (importResult.imported > 0) {
                onSuccess?.();
            }
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message ?? 'Gagal mengimpor file. Pastikan format file sesuai template.');
        } finally {
            setIsUploading(false);
        }
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
                        onClick={() => {
                            if (!isUploading) onOpenChange(false);
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
                        className="relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isUploading) onOpenChange(false);
                                }}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 px-5 py-4">
                            {/* Download template */}
                            <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                                <p className="mb-2 text-sm text-blue-800">
                                    Download template terlebih dahulu, isi data sesuai format, lalu upload.
                                </p>
                                <a
                                    href={templateUrl}
                                    download={templateFileName}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Template
                                </a>
                            </div>

                            {/* File input */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Pilih File
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex w-full items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    {file ? (
                                        <>
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <span className="truncate font-medium text-slate-700">{file.name}</span>
                                            <span className="ml-auto text-xs text-slate-400">
                                                {(file.size / 1024).toFixed(0)} KB
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 text-slate-400" />
                                            <span className="text-slate-500">Klik untuk memilih file (.xlsx, .xls, .csv)</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Result */}
                            {result && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm text-emerald-800">{result.message}</span>
                                    </div>
                                    {result.errors.length > 0 && (
                                        <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                            <div className="mb-1.5 flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-sm font-medium text-red-800">
                                                    {result.errors.length} error ditemukan:
                                                </span>
                                            </div>
                                            <ul className="max-h-40 space-y-0.5 overflow-auto text-xs text-red-700">
                                                {result.errors.map((err, i) => (
                                                    <li key={i}>• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-800">{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isUploading) onOpenChange(false);
                                }}
                                disabled={isUploading}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                {result ? 'Tutup' : 'Batal'}
                            </button>
                            {!result && (
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {isUploading ? 'Mengimpor...' : 'Import'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
