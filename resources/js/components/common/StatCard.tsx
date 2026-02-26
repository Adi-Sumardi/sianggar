import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bounceIn } from '@/lib/animations';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; isUp: boolean };
    description?: string;
    className?: string;
}

function AnimatedNumber({ value }: { value: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString('id-ID'));

    useEffect(() => {
        if (isInView) {
            animate(motionVal, value, { duration: 0.8, ease: 'easeOut' });
        }
    }, [isInView, value, motionVal]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
}

function AnimatedRupiah({ raw }: { raw: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    // Extract numeric value from Rupiah string like "Rp 1.234.567"
    const numericValue = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
    const motionVal = useMotionValue(0);
    const formatted = useTransform(motionVal, (v) => {
        const n = Math.round(v);
        return 'Rp ' + n.toLocaleString('id-ID');
    });

    useEffect(() => {
        if (isInView) {
            animate(motionVal, numericValue, { duration: 0.8, ease: 'easeOut' });
        }
    }, [isInView, numericValue, motionVal]);

    return <motion.span ref={ref}>{formatted}</motion.span>;
}

function renderAnimatedValue(value: string | number) {
    if (typeof value === 'number') {
        return <AnimatedNumber value={value} />;
    }
    // Detect Rupiah format
    if (typeof value === 'string' && value.startsWith('Rp')) {
        return <AnimatedRupiah raw={value} />;
    }
    return value;
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
            {...bounceIn}
            whileHover={{
                scale: 1.02,
                boxShadow: '0 12px 30px -8px rgba(37, 99, 235, 0.2)',
            }}
            transition={{
                ...bounceIn.transition,
                scale: { type: 'spring', stiffness: 400, damping: 25 },
            }}
            className={cn(
                'relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200',
                className,
            )}
        >
            {/* Icon */}
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                {icon}
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-slate-500">{title}</p>

            {/* Value with counter animation */}
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {renderAnimatedValue(value)}
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
