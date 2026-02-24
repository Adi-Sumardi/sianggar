import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    revised: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-teal-100 text-teal-700',
    pending: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In Review',
    approved: 'Approved',
    revised: 'Revised',
    rejected: 'Rejected',
    paid: 'Paid',
    pending: 'Pending',
    archived: 'Archived',
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
    const normalized = status.toLowerCase().replace(/\s+/g, '_');
    const colors = statusStyles[normalized] ?? 'bg-slate-100 text-slate-700';
    const label = statusLabels[normalized] ?? status;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium capitalize',
                colors,
                size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
                className,
            )}
        >
            {label}
        </span>
    );
}
