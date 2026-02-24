import { cn } from '@/lib/utils';

const sizeClasses = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-6 w-6 border-[2.5px]',
    lg: 'h-10 w-10 border-[3px]',
} as const;

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                'animate-spin rounded-full border-blue-600 border-t-transparent',
                sizeClasses[size],
                className,
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}
