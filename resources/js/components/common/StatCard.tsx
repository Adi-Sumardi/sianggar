import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/animations';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; isUp: boolean };
    description?: string;
    className?: string;
}

export function StatCard({
    title,
    value,
    icon,
    trend,
    description,
    className,
}: StatCardProps) {
    return (
        <motion.div
            {...cardHover}
            className={cn(
                'relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5',
                className,
            )}
        >
            {/* Icon */}
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                {icon}
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-slate-500">{title}</p>

            {/* Value */}
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {value}
            </p>

            {/* Trend + Description */}
            {(trend || description) && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                    {trend && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-0.5 font-medium',
                                trend.isUp ? 'text-emerald-600' : 'text-red-600',
                            )}
                        >
                            {trend.isUp ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(trend.value)}%
                        </span>
                    )}
                    {description && (
                        <span className="text-slate-500">{description}</span>
                    )}
                </div>
            )}
        </motion.div>
    );
}
