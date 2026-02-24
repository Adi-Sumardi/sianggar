import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Mail, Send, Archive, Clock, Loader2 } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/date';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useEmails } from '@/hooks/useEmails';
import type { Email } from '@/types/models';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'masuk' | 'terkirim' | 'arsip';

const tabToFilter: Record<TabKey, 'inbox' | 'sent' | 'archive'> = {
    masuk: 'inbox',
    terkirim: 'sent',
    arsip: 'archive',
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function getRecipientsDisplay(email: Email): string {
    if (email.recipients && email.recipients.length > 0) {
        return email.recipients.map((r) => r.display_name).join(', ');
    }
    return email.ditujukan || '-';
}

function getSenderDisplay(email: Email): string {
    return email.user?.name || '-';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailList() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('masuk');

    const { data, isLoading, isError } = useEmails({ filter: tabToFilter[activeTab] });

    const emails = data?.data || [];

    const tabs: { key: TabKey; label: string; icon: typeof Mail }[] = [
        { key: 'masuk', label: 'Kotak Masuk', icon: Mail },
        { key: 'terkirim', label: 'Terkirim', icon: Send },
        { key: 'arsip', label: 'Arsip', icon: Archive },
    ];

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Surat Internal"
                        description="Kelola surat menyurat internal organisasi"
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/emails/create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Buat Surat
                            </button>
                        }
                    />
                </motion.div>

                {/* Tabs */}
                <motion.div variants={staggerItem} className="mb-4">
                    <div className="flex border-b border-slate-200">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                        activeTab === tab.key
                                            ? 'text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700',
                                    )}
                                >
                                    <TabIcon className="h-4 w-4" />
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <motion.div
                                            layoutId="email-tab-indicator"
                                            className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Email list - card format */}
                <motion.div variants={staggerItem}>
                    {isLoading ? (
                        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
                        </div>
                    ) : isError ? (
                        <EmptyState
                            icon={<Mail className="h-8 w-8" />}
                            title="Gagal memuat data"
                            description="Terjadi kesalahan saat memuat data surat."
                            className="rounded-lg border border-slate-200 bg-white"
                        />
                    ) : emails.length === 0 ? (
                        <EmptyState
                            icon={<Mail className="h-8 w-8" />}
                            title="Tidak ada surat"
                            description="Belum ada surat di folder ini."
                            className="rounded-lg border border-slate-200 bg-white"
                        />
                    ) : (
                        <div className="space-y-2">
                            {emails.map((email) => (
                                <motion.div
                                    key={email.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => navigate(`/emails/${email.id}`)}
                                    className="flex cursor-pointer items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
                                >
                                    {/* Icon */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                        <Mail className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-blue-600">
                                                {email.no_surat || '-'}
                                            </span>
                                            <StatusBadge status={email.status} size="sm" />
                                        </div>
                                        <h3 className="mt-1 truncate text-sm font-medium text-slate-700">
                                            {email.name_surat}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {activeTab === 'terkirim' ? 'Kepada' : 'Dari'}:{' '}
                                            <span className="font-medium">
                                                {activeTab === 'terkirim'
                                                    ? getRecipientsDisplay(email)
                                                    : getSenderDisplay(email)}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Date */}
                                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDate(email.tgl_surat)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
