import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    MessageCircle,
    MessageSquare,
    X,
    Send,
    XCircle,
    Building2,
    User,
    FileText,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { formatRupiah } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
    useActiveDiscussions,
    useAddDiscussionMessage,
    useCloseDiscussion,
} from '@/hooks/useApprovals';
import type { ActiveDiscussion } from '@/services/approvalService';

// Leadership roles that can participate in discussions (using string values for reliable comparison)
const LEADERSHIP_ROLE_VALUES = [
    'ketum',
    'ketua-1',       // Wakil Ketua
    'sekretaris',
    'direktur',
    'kabag-sdm-umum',
    'sekretariat',   // Kabag Sekretariat
    'keuangan',
    'bendahara',
];

export function GlobalDiscussionButton() {
    const { user } = useAuthStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedDiscussionIndex, setSelectedDiscussionIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check if user is a leadership role - using string array for reliable comparison
    const isLeadershipRole = user?.role && LEADERSHIP_ROLE_VALUES.includes(user.role as string);

    // Poll for active discussions (only for leadership roles)
    const { data: activeDiscussions = [], refetch } = useActiveDiscussions({
        enabled: !!isLeadershipRole,
        refetchInterval: dialogOpen ? 3000 : 5000,
    });

    const addMessageMutation = useAddDiscussionMessage();
    const closeDiscussionMutation = useCloseDiscussion();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (dialogOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeDiscussions, dialogOpen]);

    // Don't render if not leadership role or no active discussions
    if (!isLeadershipRole || activeDiscussions.length === 0) {
        return null;
    }

    const currentDiscussion = activeDiscussions[selectedDiscussionIndex];
    const pengajuan = currentDiscussion?.pengajuan_anggaran;
    const messages = currentDiscussion?.messages || [];

    // Only the opener can close the discussion
    const canCloseDiscussion = user?.id === currentDiscussion?.opener?.id;

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !pengajuan?.id) return;

        try {
            await addMessageMutation.mutateAsync({
                pengajuanId: pengajuan.id,
                dto: { message: newMessage.trim() },
            });
            setNewMessage('');
            refetch();
        } catch {
            toast.error('Gagal mengirim pesan');
        }
    };

    const handleCloseDiscussion = async () => {
        if (!pengajuan?.id) return;

        try {
            await closeDiscussionMutation.mutateAsync(pengajuan.id);
            toast.success('Diskusi berhasil ditutup');
            refetch();
            // If this was the only discussion, close the dialog
            if (activeDiscussions.length === 1) {
                setDialogOpen(false);
            } else if (selectedDiscussionIndex >= activeDiscussions.length - 1) {
                setSelectedDiscussionIndex(Math.max(0, selectedDiscussionIndex - 1));
            }
        } catch {
            toast.error('Gagal menutup diskusi');
        }
    };

    const handlePrevDiscussion = () => {
        setSelectedDiscussionIndex(
            (prev) => (prev - 1 + activeDiscussions.length) % activeDiscussions.length
        );
    };

    const handleNextDiscussion = () => {
        setSelectedDiscussionIndex(
            (prev) => (prev + 1) % activeDiscussions.length
        );
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!dialogOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        type="button"
                        onClick={() => setDialogOpen(true)}
                        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all hover:bg-green-700 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500/30 sm:bottom-6 bottom-24"
                    >
                        {/* Pulse ring animation */}
                        <span className="absolute -inset-1 animate-ping rounded-full bg-green-400 opacity-30" />
                        <span className="absolute -inset-0.5 rounded-full bg-green-500 opacity-20" />

                        <MessageCircle className="relative h-6 w-6" />

                        {/* Discussion count badge */}
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-sm">
                            {activeDiscussions.length}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
                {!dialogOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: 0.5 }}
                        className="fixed bottom-8 right-24 z-40 hidden sm:block"
                    >
                        <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                                {activeDiscussions.length} Diskusi Aktif
                            </div>
                            <div className="mt-0.5 text-xs text-slate-300">
                                Klik untuk bergabung
                            </div>
                        </div>
                        {/* Arrow pointing to button */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                            <div className="border-8 border-transparent border-l-slate-900" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Discussion Dialog */}
            <AnimatePresence>
                {dialogOpen && currentDiscussion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setDialogOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="flex h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with Pengajuan Info */}
                            <div className="border-b border-slate-200 px-6 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="rounded-lg bg-green-100 p-2 flex-shrink-0">
                                            <MessageCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    Diskusi Internal Pimpinan
                                                </h3>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                                    Aktif
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDialogOpen(false)}
                                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 flex-shrink-0"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Pengajuan Info Card */}
                                {pengajuan && (
                                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2 flex-shrink-0">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-slate-900 line-clamp-2">
                                                    {pengajuan.perihal || pengajuan.nama_pengajuan || '-'}
                                                </h4>
                                                <p className="mt-0.5 text-sm font-medium text-blue-600">
                                                    {pengajuan.nomor_pengajuan || '-'}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                                    {pengajuan.unit_relation?.nama && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            <span>{pengajuan.unit_relation.nama}</span>
                                                        </div>
                                                    )}
                                                    {pengajuan.user?.name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5" />
                                                            <span>{pengajuan.user.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-lg font-bold text-slate-900">
                                                    {formatRupiah(pengajuan.jumlah_pengajuan_total || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation for multiple discussions */}
                                {activeDiscussions.length > 1 && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handlePrevDiscussion}
                                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Sebelumnya
                                        </button>
                                        <span className="text-sm text-slate-500">
                                            {selectedDiscussionIndex + 1} dari {activeDiscussions.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleNextDiscussion}
                                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                        >
                                            Berikutnya
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Participants Info */}
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
                                <p className="text-xs text-slate-500">
                                    <span className="font-medium">Peserta diskusi:</span> Ketua Umum, Wakil Ketua, Sekretaris, Direktur Pendidikan, Kabag SDM Umum, Kabag Sekretariat, Keuangan, Bendahara
                                </p>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="rounded-full bg-slate-100 p-4 mb-4">
                                            <MessageSquare className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-base font-medium text-slate-700">
                                            Belum ada pesan
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm">
                                            Mulai diskusi dengan mengirim pesan pertama.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg: any) => {
                                            const isCurrentUser = msg.user?.id === user?.id;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        'flex',
                                                        isCurrentUser ? 'justify-end' : 'justify-start'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'max-w-[75%] rounded-2xl px-4 py-3',
                                                            isCurrentUser
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-slate-100 text-slate-900'
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            'mb-1 text-xs font-medium',
                                                            isCurrentUser ? 'text-purple-200' : 'text-slate-500'
                                                        )}>
                                                            {msg.user?.name || 'Unknown'}
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {msg.message}
                                                        </p>
                                                        <div className={cn(
                                                            'mt-1 text-xs',
                                                            isCurrentUser ? 'text-purple-200' : 'text-slate-400'
                                                        )}>
                                                            {msg.created_at ? new Date(msg.created_at).toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Input & Actions */}
                            <div className="border-t border-slate-200">
                                {/* Message Input */}
                                <div className="px-6 py-4">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Ketik pesan..."
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSendMessage}
                                            disabled={addMessageMutation.isPending || !newMessage.trim()}
                                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Tekan Enter untuk mengirim
                                    </p>
                                </div>

                                {/* End Discussion Button (only opener can close) */}
                                <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Diskusi dibuka oleh {currentDiscussion.opener?.name || 'Unknown'} pada{' '}
                                            {currentDiscussion.opened_at
                                                ? new Date(currentDiscussion.opened_at).toLocaleString('id-ID', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit'
                                                  })
                                                : '-'
                                            }
                                        </p>
                                        {canCloseDiscussion && (
                                            <button
                                                type="button"
                                                onClick={handleCloseDiscussion}
                                                disabled={closeDiscussionMutation.isPending}
                                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {closeDiscussionMutation.isPending ? 'Mengakhiri...' : 'Akhiri Diskusi'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
