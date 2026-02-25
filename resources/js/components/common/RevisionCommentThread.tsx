import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    AlertTriangle,
    Lock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
    useRevisionComments,
    useRevisionCommentHistory,
    useAddRevisionComment,
} from '@/hooks/useRevisionComments';
import type { RevisionDocType } from '@/services/revisionCommentService';
import type { RevisionComment } from '@/types/models';

interface RevisionCommentThreadProps {
    docType: RevisionDocType;
    docId: number;
    className?: string;
}

export function RevisionCommentThread({
    docType,
    docId,
    className,
}: RevisionCommentThreadProps) {
    const { user } = useAuthStore();
    const [newMessage, setNewMessage] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: threadData, isLoading } = useRevisionComments(docType, docId, {
        refetchInterval: 5000,
    });

    const { data: historyData } = useRevisionCommentHistory(docType, docId, {
        enabled: showHistory,
    });

    const addCommentMutation = useAddRevisionComment(docType);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [threadData?.comments]);

    if (isLoading) {
        return (
            <div className={cn('rounded-lg border border-amber-200 bg-amber-50 p-6', className)}>
                <div className="flex items-center gap-2 text-amber-600">
                    <MessageSquare className="h-5 w-5 animate-pulse" />
                    <span className="text-sm font-medium">Memuat diskusi revisi...</span>
                </div>
            </div>
        );
    }

    // Don't render if there are no comments and document is not in revision
    if (!threadData || (threadData.current_round === 0 && !threadData.is_in_revision)) {
        return null;
    }

    const { comments, is_read_only, can_comment } = threadData;
    const current_round = Math.max(1, threadData.current_round);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await addCommentMutation.mutateAsync({
                docId,
                dto: { message: newMessage.trim() },
            });
            setNewMessage('');
        } catch {
            toast.error('Gagal mengirim komentar');
        }
    };

    const previousRounds = historyData
        ? Object.entries(historyData.rounds)
              .filter(([round]) => Number(round) < current_round)
              .sort(([a], [b]) => Number(a) - Number(b))
        : [];

    return (
        <div className={cn('rounded-lg border border-amber-200 bg-white', className)}>
            {/* Header */}
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-amber-100 p-1.5">
                            <MessageSquare className="h-4 w-4 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-amber-900">
                            Diskusi Revisi
                        </h3>
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Revisi ke-{current_round}
                        </span>
                    </div>

                    {is_read_only && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Ditutup</span>
                        </div>
                    )}
                </div>
            </div>

            {/* History Toggle */}
            {current_round > 1 && (
                <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex w-full items-center justify-center gap-1 border-b border-amber-100 bg-amber-50/50 px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100/50 transition-colors"
                >
                    {showHistory ? (
                        <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Sembunyikan riwayat revisi sebelumnya
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Lihat {current_round - 1} riwayat revisi sebelumnya
                        </>
                    )}
                </button>
            )}

            {/* Previous Rounds */}
            {showHistory && previousRounds.length > 0 && (
                <div className="border-b border-amber-100 bg-slate-50 px-5 py-4">
                    {previousRounds.map(([round, roundComments]) => (
                        <div key={round} className="mb-4 last:mb-0">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                    Revisi ke-{round}
                                </span>
                                <hr className="flex-1 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                {(roundComments as RevisionComment[]).map((comment) => (
                                    <CommentBubble
                                        key={comment.id}
                                        comment={comment}
                                        isCurrentUser={comment.user_id === user?.id}
                                        muted
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Current Round Messages */}
            <div className="max-h-80 overflow-y-auto px-5 py-4">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-amber-100 p-3 mb-3">
                            <MessageSquare className="h-6 w-6 text-amber-400" />
                        </div>
                        <p className="text-sm text-slate-500">
                            Belum ada komentar di thread ini.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {comments.map((comment) => (
                            <CommentBubble
                                key={comment.id}
                                comment={comment}
                                isCurrentUser={comment.user_id === user?.id}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Read-Only Banner */}
            {is_read_only && current_round > 0 && (
                <div className="border-t border-amber-100 bg-slate-50 px-5 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Thread ditutup karena dokumen telah diajukan kembali.</span>
                    </div>
                </div>
            )}

            {/* Input Area */}
            {!is_read_only && can_comment && (
                <div className="border-t border-amber-200 bg-amber-50/50 px-5 py-3">
                    <div className="flex gap-2">
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
                            placeholder="Tulis komentar atau sanggahan..."
                            className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={addCommentMutation.isPending || !newMessage.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                        Tekan Enter untuk mengirim
                    </p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// CommentBubble sub-component
// ---------------------------------------------------------------------------

function CommentBubble({
    comment,
    isCurrentUser,
    muted = false,
}: {
    comment: RevisionComment;
    isCurrentUser: boolean;
    muted?: boolean;
}) {
    // Initial note from approver — special card style
    if (comment.is_initial_note) {
        return (
            <div className={cn(
                'rounded-lg border px-4 py-3',
                muted
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-amber-200 bg-amber-50'
            )}>
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={cn(
                        'h-3.5 w-3.5',
                        muted ? 'text-slate-400' : 'text-amber-500'
                    )} />
                    <span className={cn(
                        'text-xs font-semibold',
                        muted ? 'text-slate-500' : 'text-amber-700'
                    )}>
                        Catatan Revisi dari {comment.user?.name || 'Approver'}
                    </span>
                </div>
                <p className={cn(
                    'text-sm whitespace-pre-wrap',
                    muted ? 'text-slate-600' : 'text-amber-900'
                )}>
                    {comment.message}
                </p>
                <div className={cn(
                    'mt-1.5 text-xs',
                    muted ? 'text-slate-400' : 'text-amber-500'
                )}>
                    {formatDate(comment.created_at)}
                </div>
            </div>
        );
    }

    // Regular chat bubble
    return (
        <div className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5',
                    muted
                        ? isCurrentUser
                            ? 'bg-slate-300 text-slate-700'
                            : 'bg-slate-100 text-slate-600'
                        : isCurrentUser
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                )}
            >
                <div className={cn(
                    'mb-0.5 text-xs font-medium',
                    muted
                        ? 'text-slate-500'
                        : isCurrentUser
                            ? 'text-amber-200'
                            : 'text-slate-500'
                )}>
                    {comment.user?.name || 'Unknown'}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                <div className={cn(
                    'mt-1 text-xs',
                    muted
                        ? 'text-slate-400'
                        : isCurrentUser
                            ? 'text-amber-200'
                            : 'text-slate-400'
                )}>
                    {formatDate(comment.created_at)}
                </div>
            </div>
        </div>
    );
}

function formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
