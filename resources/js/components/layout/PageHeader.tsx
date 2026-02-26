import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';
import { float } from '@/lib/animations';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Breadcrumb label mapping
// ---------------------------------------------------------------------------

const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    admin: 'Admin',
    users: 'Kelola User',
    create: 'Tambah',
    edit: 'Edit',
    budget: 'Anggaran',
    'mata-anggaran': 'Mata Anggaran',
    apbs: 'APBS',
    rapbs: 'RAPBS',
    coa: 'COA',
    pengajuan: 'Pengajuan',
    approvals: 'Approval',
    perubahan: 'Perubahan',
    lpj: 'LPJ',
    laporan: 'Laporan',
    cawu: 'CAWU',
    accounting: 'Akuntansi',
    planning: 'Perencanaan',
    strategies: 'Strategi',
    indicators: 'Indikator',
    prokers: 'Proker',
    activities: 'Kegiatan',
    pkt: 'PKT',
    emails: 'Surat Internal',
};

function segmentLabel(segment: string): string {
    // If it looks like an ID (only digits), skip displaying it in breadcrumb
    if (/^\d+$/.test(segment)) return `#${segment}`;
    return labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageHeader({
    title,
    description,
    actions,
    className,
}: PageHeaderProps) {
    const { pathname } = useLocation();
    const segments = pathname.split('/').filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                'relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-[#063E66] to-[#1C61A2] px-6 py-5 text-white shadow-lg print:bg-white print:py-2 print:text-slate-900 print:shadow-none sm:px-8 sm:py-6',
                className,
            )}
        >
            {/* Decorative floating circles */}
            <motion.div
                {...float}
                className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5 print:hidden"
            />
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -bottom-4 right-20 h-20 w-20 rounded-full bg-white/5 print:hidden"
            />
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute left-1/3 top-2 h-12 w-12 rounded-full bg-white/[0.03] print:hidden"
            />

            <div className="relative z-10 space-y-1">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1 text-sm text-white/60 print:hidden">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-1 transition-colors hover:text-white"
                    >
                        <Home className="h-3.5 w-3.5" />
                    </Link>

                    {segments.map((segment, index) => {
                        const path = '/' + segments.slice(0, index + 1).join('/');
                        const isLast = index === segments.length - 1;
                        const label = segmentLabel(segment);

                        return (
                            <span key={path} className="flex items-center gap-1">
                                <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                                {isLast ? (
                                    <span className="font-medium text-white">
                                        {label}
                                    </span>
                                ) : (
                                    <Link
                                        to={path}
                                        className="transition-colors hover:text-white"
                                    >
                                        {label}
                                    </Link>
                                )}
                            </span>
                        );
                    })}
                </nav>

                {/* Title row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-1 text-sm text-white/70 print:text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>

                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 print:hidden">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
