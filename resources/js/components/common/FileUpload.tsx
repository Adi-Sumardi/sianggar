import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudUpload, File, X, Download, AlertCircle, Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExistingFile {
    id: number;
    name: string;
    url: string;
    mime_type?: string;
}

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    onDeleteExisting?: (id: number) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    existingFiles?: ExistingFile[];
    isDeleting?: boolean;
    className?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
    onFilesSelected,
    onDeleteExisting,
    accept,
    multiple = false,
    maxSize,
    existingFiles,
    isDeleting,
    className,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<ExistingFile | null>(null);

    const isPdf = (filename: string) => filename.toLowerCase().endsWith('.pdf');
    const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    const validateFiles = useCallback(
        (files: File[]): File[] => {
            setError(null);
            if (maxSize) {
                const maxBytes = maxSize * 1024 * 1024;
                const oversized = files.filter((f) => f.size > maxBytes);
                if (oversized.length > 0) {
                    setError(
                        `File ${oversized.map((f) => f.name).join(', ')} melebihi batas ukuran ${maxSize} MB`,
                    );
                    return files.filter((f) => f.size <= maxBytes);
                }
            }
            return files;
        },
        [maxSize],
    );

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;
            const files = Array.from(fileList);
            const valid = validateFiles(files);
            if (valid.length === 0) return;

            const next = multiple ? [...selectedFiles, ...valid] : valid;
            setSelectedFiles(next);
            onFilesSelected(next);
        },
        [multiple, selectedFiles, onFilesSelected, validateFiles],
    );

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles],
    );

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            // Reset so same file can be re-selected
            e.target.value = '';
        },
        [handleFiles],
    );

    const removeFile = useCallback(
        (index: number) => {
            const next = selectedFiles.filter((_, i) => i !== index);
            setSelectedFiles(next);
            onFilesSelected(next);
            setError(null);
        },
        [selectedFiles, onFilesSelected],
    );

    return (
        <div className={cn('space-y-3', className)}>
            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
                    isDragOver
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30',
                )}
            >
                <CloudUpload
                    className={cn(
                        'mb-3 h-10 w-10 transition-colors',
                        isDragOver
                            ? 'text-blue-500'
                            : 'text-slate-400 group-hover:text-blue-400',
                    )}
                />
                <p className="text-sm font-medium text-slate-600">
                    Drag & drop file di sini, atau{' '}
                    <span className="text-blue-600 underline underline-offset-2">
                        klik untuk pilih
                    </span>
                </p>
                {accept && (
                    <p className="mt-1 text-xs text-slate-400">
                        Format: {accept}
                    </p>
                )}
                {maxSize && (
                    <p className="mt-0.5 text-xs text-slate-400">
                        Maks. {maxSize} MB per file
                    </p>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Error message */}
            {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Selected files */}
            <AnimatePresence mode="popLayout">
                {selectedFiles.map((file, index) => (
                    <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                            <File className="h-4 w-4 shrink-0 text-blue-500" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-700">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                aria-label={`Hapus ${file.name}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Existing files */}
            {existingFiles && existingFiles.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-500">
                        File yang sudah diunggah
                    </p>
                    {existingFiles.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                            {isPdf(file.name) ? (
                                <FileText className="h-4 w-4 shrink-0 text-red-500" />
                            ) : (
                                <File className="h-4 w-4 shrink-0 text-slate-400" />
                            )}
                            <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="min-w-0 flex-1 truncate text-left text-sm text-blue-600 hover:underline"
                            >
                                {file.name}
                            </button>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="rounded p-1 text-emerald-500 transition-colors hover:bg-emerald-50"
                                    aria-label={`Lihat ${file.name}`}
                                    title="Lihat file"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded p-1 text-blue-500 transition-colors hover:bg-blue-50"
                                    aria-label={`Download ${file.name}`}
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                                {onDeleteExisting && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteExisting(file.id)}
                                        disabled={isDeleting}
                                        className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                        aria-label={`Hapus ${file.name}`}
                                        title="Hapus"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {isPdf(previewFile.name) ? (
                                        <FileText className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <File className="h-5 w-5 text-slate-400" />
                                    )}
                                    <h3 className="text-sm font-semibold text-slate-800 truncate max-w-md">
                                        {previewFile.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewFile.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewFile(null)}
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Content */}
                            <div className="flex-1 overflow-auto bg-slate-100 p-4">
                                {isPdf(previewFile.name) ? (
                                    <iframe
                                        src={previewFile.url}
                                        className="h-full w-full rounded border border-slate-200 bg-white"
                                        title={previewFile.name}
                                    />
                                ) : isImage(previewFile.name) ? (
                                    <div className="flex h-full items-center justify-center">
                                        <img
                                            src={previewFile.url}
                                            alt={previewFile.name}
                                            className="max-h-full max-w-full rounded object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-500">
                                        <File className="h-16 w-16" />
                                        <p className="text-sm">Preview tidak tersedia untuk file ini.</p>
                                        <a
                                            href={previewFile.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download File
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
