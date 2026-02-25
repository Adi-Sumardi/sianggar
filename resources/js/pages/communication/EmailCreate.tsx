import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Send, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileUpload } from '@/components/common/FileUpload';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useCreateEmail, useEmailRecipients } from '@/hooks/useEmails';
import type { EmailRecipientDTO } from '@/types/api';
import type { EmailRecipientOption } from '@/services/emailService';


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailCreate() {
    const navigate = useNavigate();

    const [namaSurat, setNamaSurat] = useState('');
    const [noSurat, setNoSurat] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState<EmailRecipientOption[]>([]);
    const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split('T')[0]);
    const [isiSurat, setIsiSurat] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
    const [recipientSearch, setRecipientSearch] = useState('');

    const { data: recipientsData, isLoading: loadingRecipients } = useEmailRecipients();
    const createEmail = useCreateEmail();

    const allRecipients = recipientsData?.users || [];

    const filteredRecipients = allRecipients.filter((r) => {
        const isNotSelected = !selectedRecipients.some(
            (s) => s.user_id === r.user_id && s.role === r.role
        );
        const matchesSearch = r.label.toLowerCase().includes(recipientSearch.toLowerCase());
        return isNotSelected && matchesSearch;
    });

    const handleAddRecipient = (recipient: EmailRecipientOption) => {
        setSelectedRecipients((prev) => [...prev, recipient]);
        setRecipientSearch('');
        setShowRecipientDropdown(false);
    };

    const handleRemoveRecipient = (recipient: EmailRecipientOption) => {
        setSelectedRecipients((prev) =>
            prev.filter((r) => r.user_id !== recipient.user_id || r.role !== recipient.role)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaSurat.trim()) {
            toast.error('Nama surat wajib diisi');
            return;
        }
        if (selectedRecipients.length === 0) {
            toast.error('Pilih minimal satu penerima');
            return;
        }
        if (!isiSurat.trim()) {
            toast.error('Isi surat wajib diisi');
            return;
        }

        const recipients: EmailRecipientDTO[] = selectedRecipients.map((r) => ({
            user_id: r.user_id,
            role: r.role,
        }));

        try {
            await createEmail.mutateAsync({
                name_surat: namaSurat,
                ...(noSurat.trim() && { no_surat: noSurat.trim() }),
                tgl_surat: tanggalSurat,
                isi_surat: isiSurat,
                recipients,
                ...(files.length > 0 && { files }),
            });

            toast.success('Surat berhasil dikirim');
            navigate('/emails');
        } catch {
            toast.error('Gagal mengirim surat');
        }
    };

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Buat Surat Internal"
                        description="Buat dan kirim surat internal baru"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/emails')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Main form */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Detail Surat
                            </h3>

                            <div className="space-y-5">
                                {/* Nama Surat */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Nama Surat <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaSurat}
                                        onChange={(e) => setNamaSurat(e.target.value)}
                                        placeholder="Contoh: Undangan Rapat Koordinasi"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* No Surat (optional, auto-generated if empty) */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        No. Surat
                                    </label>
                                    <input
                                        type="text"
                                        value={noSurat}
                                        onChange={(e) => setNoSurat(e.target.value)}
                                        placeholder="Kosongkan untuk auto-generate"
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        Isi nomor surat manual atau kosongkan untuk generate otomatis
                                    </p>
                                </div>

                                {/* Ditujukan Kepada (Multi-select) */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Ditujukan Kepada <span className="text-red-500">*</span>
                                    </label>

                                    {/* Selected recipients */}
                                    {selectedRecipients.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {selectedRecipients.map((recipient, index) => (
                                                <span
                                                    key={`user-${recipient.user_id}-${index}`}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                                                >
                                                    <User className="h-3.5 w-3.5" />
                                                    {recipient.label}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRecipient(recipient)}
                                                        className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Recipient search input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={recipientSearch}
                                            onChange={(e) => {
                                                setRecipientSearch(e.target.value);
                                                setShowRecipientDropdown(true);
                                            }}
                                            onFocus={() => setShowRecipientDropdown(true)}
                                            placeholder="Cari penerima (nama atau role)..."
                                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />

                                        {/* Dropdown */}
                                        {showRecipientDropdown && (
                                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                                                {loadingRecipients ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                                    </div>
                                                ) : filteredRecipients.length === 0 ? (
                                                    <div className="px-3 py-2 text-sm text-slate-500">
                                                        Tidak ada hasil
                                                    </div>
                                                ) : (
                                                    filteredRecipients.map((recipient) => (
                                                        <button
                                                            key={`user-${recipient.user_id}`}
                                                            type="button"
                                                            onClick={() => handleAddRecipient(recipient)}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                        >
                                                            <User className="h-4 w-4 text-blue-500" />
                                                            <div>
                                                                <div className="font-medium text-slate-700">
                                                                    {recipient.label}
                                                                </div>
                                                                <div className="text-xs text-slate-400">
                                                                    {recipient.description}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Click outside to close */}
                                    {showRecipientDropdown && (
                                        <div
                                            className="fixed inset-0 z-0"
                                            onClick={() => setShowRecipientDropdown(false)}
                                        />
                                    )}
                                </div>

                                {/* Tanggal Surat */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tanggal Surat
                                    </label>
                                    <input
                                        type="date"
                                        value={tanggalSurat}
                                        onChange={(e) => setTanggalSurat(e.target.value)}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Isi Surat */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Isi Surat <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={isiSurat}
                                        onChange={(e) => setIsiSurat(e.target.value)}
                                        placeholder="Tulis isi surat di sini..."
                                        rows={10}
                                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lampiran */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h3 className="mb-2 text-base font-semibold text-slate-900">
                                Lampiran
                            </h3>
                            <p className="mb-4 text-xs text-slate-500">
                                Upload file lampiran jika diperlukan.
                            </p>
                            <FileUpload
                                onFilesSelected={setFiles}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                                multiple
                                maxSize={10}
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/emails')}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createEmail.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createEmail.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Kirim Surat
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
