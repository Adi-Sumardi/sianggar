import { CheckCircle2, Clock, XCircle, CircleDot, Circle, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLpjStageLabel, getReferenceTypeLabel } from '@/types/enums';
import type { LpjExpectedStage, LpjValidation } from '@/types/models';
import { formatDate } from '@/lib/date';

interface LpjApprovalTimelineProps {
    stages: LpjExpectedStage[];
    validation?: LpjValidation | null;
    className?: string;
}

const statusConfig = {
    approved: {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
        border: 'border-emerald-500',
        line: 'bg-emerald-500',
    },
    pending: {
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-500',
        line: 'bg-amber-300',
    },
    current: {
        icon: CircleDot,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        line: 'bg-blue-300',
    },
    revised: {
        icon: XCircle,
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        border: 'border-orange-500',
        line: 'bg-orange-300',
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-500',
        line: 'bg-red-500',
    },
    future: {
        icon: Circle,
        color: 'text-slate-400',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        line: 'bg-slate-200',
    },
};

export function LpjApprovalTimeline({
    stages,
    validation,
    className,
}: LpjApprovalTimelineProps) {
    if (!stages || stages.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data approval.
            </div>
        );
    }

    return (
        <div className={cn('space-y-1', className)}>
            {stages.map((stage, index) => {
                const config = statusConfig[stage.status] || statusConfig.future;
                const Icon = config.icon;
                const isLast = index === stages.length - 1;
                const isStaffKeuangan = stage.stage === 'staff-keuangan';

                return (
                    <div key={`${stage.stage}-${index}`} className="relative flex gap-4">
                        {/* Vertical line connector */}
                        {!isLast && (
                            <div
                                className={cn(
                                    'absolute left-4 top-8 w-0.5 -translate-x-1/2',
                                    stage.status === 'approved'
                                        ? 'bg-emerald-500'
                                        : stage.status === 'current'
                                          ? 'bg-blue-300'
                                          : 'bg-slate-200',
                                )}
                                style={{ height: 'calc(100% - 1rem)' }}
                            />
                        )}

                        {/* Icon */}
                        <div
                            className={cn(
                                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2',
                                config.bg,
                                config.border,
                            )}
                        >
                            <Icon className={cn('h-4 w-4', config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className={cn(
                                            'text-sm font-medium',
                                            stage.status === 'future'
                                                ? 'text-slate-400'
                                                : 'text-slate-900',
                                        )}
                                    >
                                        {getLpjStageLabel(stage.stage)}
                                    </p>
                                    <p className="text-xs text-slate-500">Tahap {stage.order}</p>
                                </div>
                                {stage.approval?.approved_at && (
                                    <span className="text-xs text-slate-500">
                                        {formatDate(stage.approval.approved_at)}
                                    </span>
                                )}
                            </div>

                            {/* Approver info */}
                            {stage.approval?.approver && (
                                <p className="mt-1 text-xs text-slate-600">
                                    oleh {stage.approval.approver.name}
                                </p>
                            )}

                            {/* Notes */}
                            {stage.approval?.notes && (
                                <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                    {stage.approval.notes}
                                </p>
                            )}

                            {/* Validation details for Staf Keuangan stage */}
                            {isStaffKeuangan && validation && stage.status === 'approved' && (
                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                        <FileCheck className="h-3.5 w-3.5" />
                                        Hasil Validasi
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            <span className="text-slate-600">
                                                {validation.checked_count}/{validation.total_items}{' '}
                                                checklist terpenuhi
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-500">Rujukan:</span>
                                            <span className="font-medium text-slate-700">
                                                {validation.reference_type_label ||
                                                    getReferenceTypeLabel(validation.reference_type)}
                                            </span>
                                        </div>
                                    </div>
                                    {validation.notes && (
                                        <p className="mt-2 text-xs text-slate-600">
                                            {validation.notes}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Current stage indicator */}
                            {stage.status === 'current' && (
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                    </span>
                                    Menunggu persetujuan
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
