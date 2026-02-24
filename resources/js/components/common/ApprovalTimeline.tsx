import { motion } from 'motion/react';
import { Check, X, AlertTriangle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { formatDateTime } from '@/lib/date';
import { ApprovalStatus, getStageLabel } from '@/types/enums';
import type { Approval } from '@/types/models';

interface ApprovalTimelineProps {
    approvals: Approval[];
    currentStage?: string | null;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
}

function getNodeStyle(approval: Approval, isCurrent: boolean) {
    if (approval.status === ApprovalStatus.Approved) {
        return {
            ring: 'bg-emerald-500 text-white',
            icon: <Check className="h-4 w-4" />,
            line: 'bg-emerald-300',
            badge: 'bg-emerald-100 text-emerald-700',
            label: 'Disetujui',
        };
    }
    if (approval.status === ApprovalStatus.Rejected) {
        return {
            ring: 'bg-red-500 text-white',
            icon: <X className="h-4 w-4" />,
            line: 'bg-red-300',
            badge: 'bg-red-100 text-red-700',
            label: 'Ditolak',
        };
    }
    if (approval.status === ApprovalStatus.Revised) {
        return {
            ring: 'bg-amber-500 text-white',
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
            line: 'bg-amber-300',
            badge: 'bg-amber-100 text-amber-700',
            label: 'Revisi',
        };
    }
    if (isCurrent) {
        return {
            ring: 'bg-blue-500 text-white ring-4 ring-blue-500/20',
            icon: <Clock className="h-4 w-4" />,
            line: 'bg-slate-200',
            badge: 'bg-blue-100 text-blue-700',
            label: 'Menunggu',
            pulse: true,
        };
    }
    // Future / pending
    return {
        ring: 'bg-slate-200 text-slate-400',
        icon: <Circle className="h-3.5 w-3.5" />,
        line: 'bg-slate-200',
        badge: 'bg-slate-100 text-slate-600',
        label: 'Menunggu',
    };
}

// ---------------------------------------------------------------------------
// Horizontal orientation
// ---------------------------------------------------------------------------

function HorizontalTimeline({ approvals, currentStage, className }: ApprovalTimelineProps) {
    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn('flex items-start gap-0 overflow-x-auto pb-2', className)}
        >
            {approvals.map((approval, index) => {
                const isCurrent =
                    approval.stage === currentStage &&
                    approval.status === ApprovalStatus.Pending;
                const style = getNodeStyle(approval, isCurrent);
                const isLast = index === approvals.length - 1;

                return (
                    <motion.div
                        key={approval.id}
                        variants={staggerItem}
                        className="flex items-start"
                    >
                        <div className="flex flex-col items-center">
                            {/* Node */}
                            <div
                                className={cn(
                                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                                    style.ring,
                                )}
                            >
                                {style.icon}
                                {'pulse' in style && style.pulse && (
                                    <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-30" />
                                )}
                            </div>

                            {/* Label below */}
                            <div className="mt-2 w-28 text-center">
                                <p className="text-xs font-semibold text-slate-700">
                                    {getStageLabel(approval.stage)}
                                </p>
                                <span
                                    className={cn(
                                        'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                        style.badge,
                                    )}
                                >
                                    {style.label}
                                </span>
                                {approval.approver && (
                                    <p className="mt-1 truncate text-[10px] text-slate-500">
                                        {approval.approver.name}
                                    </p>
                                )}
                                {approval.approved_at && (
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {formatDateTime(approval.approved_at)}
                                    </p>
                                )}
                                {approval.notes && (
                                    <p className="mt-0.5 truncate text-[10px] italic text-slate-400">
                                        &ldquo;{approval.notes}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connector */}
                        {!isLast && (
                            <div
                                className={cn('mt-4.5 h-0.5 w-10 shrink-0', style.line)}
                            />
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Vertical orientation (default)
// ---------------------------------------------------------------------------

function VerticalTimeline({ approvals, currentStage, className }: ApprovalTimelineProps) {
    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn('relative', className)}
        >
            {approvals.map((approval, index) => {
                const isCurrent =
                    approval.stage === currentStage &&
                    approval.status === ApprovalStatus.Pending;
                const style = getNodeStyle(approval, isCurrent);
                const isLast = index === approvals.length - 1;

                return (
                    <motion.div
                        key={approval.id}
                        variants={staggerItem}
                        className="relative flex gap-4"
                    >
                        {/* Connector line (behind the node) */}
                        {!isLast && (
                            <div
                                className={cn(
                                    'absolute left-4.25 top-10 h-[calc(100%-16px)] w-0.5',
                                    style.line,
                                )}
                            />
                        )}

                        {/* Node */}
                        <div
                            className={cn(
                                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                                style.ring,
                            )}
                        >
                            {style.icon}
                            {'pulse' in style && style.pulse && (
                                <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-30" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                    {getStageLabel(approval.stage)}
                                </p>
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                        style.badge,
                                    )}
                                >
                                    {style.label}
                                </span>
                            </div>

                            {approval.approver && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                    oleh {approval.approver.name}
                                </p>
                            )}

                            {approval.approved_at && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                    {formatDateTime(approval.approved_at)}
                                </p>
                            )}

                            {approval.notes && (
                                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-xs italic text-slate-600">
                                        &ldquo;{approval.notes}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ApprovalTimeline({
    approvals,
    currentStage,
    orientation = 'vertical',
    className,
}: ApprovalTimelineProps) {
    if (approvals.length === 0) return null;

    if (orientation === 'horizontal') {
        return (
            <HorizontalTimeline
                approvals={approvals}
                currentStage={currentStage}
                className={className}
            />
        );
    }

    return (
        <VerticalTimeline
            approvals={approvals}
            currentStage={currentStage}
            className={className}
        />
    );
}
