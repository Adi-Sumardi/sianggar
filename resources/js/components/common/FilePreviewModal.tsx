import { Download, ExternalLink, X, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Attachment } from '@/types/models';

interface FilePreviewModalProps {
    file: Attachment | null;
    open: boolean;
    onClose: () => void;
}

function getFileType(mimeType: string): 'pdf' | 'image' | 'other' {
    if (mimeType === 'application/pdf') {
        return 'pdf';
    }
    if (mimeType.startsWith('image/')) {
        return 'image';
    }
    return 'other';
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewModal({ file, open, onClose }: FilePreviewModalProps) {
    if (!file) return null;

    const fileType = getFileType(file.mime_type);

    const handleOpenInNewTab = () => {
        window.open(file.path, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className="max-w-4xl h-[85vh] flex flex-col p-0"
                showCloseButton={false}
            >
                {/* Header */}
                <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                            <div className="min-w-0">
                                <DialogTitle className="truncate text-base">
                                    {file.nama}
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {formatFileSize(file.size)} • {file.mime_type}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenInNewTab}
                                title="Buka di tab baru"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <a
                                href={file.path}
                                download={file.nama}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </a>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Preview Content */}
                <div className="flex-1 overflow-hidden bg-slate-100">
                    {fileType === 'pdf' && (
                        <iframe
                            src={`${file.path}#toolbar=1&navpanes=0`}
                            className="w-full h-full border-0"
                            title={file.nama}
                        />
                    )}

                    {fileType === 'image' && (
                        <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                            <img
                                src={file.path}
                                alt={file.nama}
                                className="max-w-full max-h-full object-contain rounded shadow-lg"
                            />
                        </div>
                    )}

                    {fileType === 'other' && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8">
                            <FileText className="h-16 w-16 mb-4 text-slate-300" />
                            <p className="text-lg font-medium text-slate-700 mb-2">
                                Preview tidak tersedia
                            </p>
                            <p className="text-sm text-slate-500 mb-4 text-center">
                                Tipe file ini tidak dapat ditampilkan di browser.
                                <br />
                                Silakan download untuk melihat file.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleOpenInNewTab}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Buka di Tab Baru
                                </Button>
                                <a
                                    href={file.path}
                                    download={file.nama}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
