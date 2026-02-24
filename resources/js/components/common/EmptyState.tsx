import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center px-4 py-12 text-center',
                className,
            )}
        >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                {icon ?? <Inbox className="h-8 w-8" />}
            </div>
            <h3 className="text-base font-semibold text-slate-700">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
