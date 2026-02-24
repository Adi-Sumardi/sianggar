import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';
import { slideUp } from '@/lib/animations';
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
            initial={slideUp.initial}
            animate={slideUp.animate}
            transition={slideUp.transition}
            className={cn('mb-6 space-y-1', className)}
        >
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground print:hidden">
                <Link
                    to="/dashboard"
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                >
                    <Home className="h-3.5 w-3.5" />
                </Link>

                {segments.map((segment, index) => {
                    const path = '/' + segments.slice(0, index + 1).join('/');
                    const isLast = index === segments.length - 1;
                    const label = segmentLabel(segment);

                    return (
                        <span key={path} className="flex items-center gap-1">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            {isLast ? (
                                <span className="font-medium text-foreground">
                                    {label}
                                </span>
                            ) : (
                                <Link
                                    to={path}
                                    className="transition-colors hover:text-foreground"
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
                    <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
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
        </motion.div>
    );
}
