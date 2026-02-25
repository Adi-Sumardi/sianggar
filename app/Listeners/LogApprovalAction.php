<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\LpjApproved;
use App\Events\ProposalApproved;
use App\Events\ProposalRevised;
use App\Models\ActivityLog;
use Illuminate\Events\Dispatcher;

class LogApprovalAction
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            ProposalApproved::class,
            [self::class, 'handleProposalApproved'],
        );

        $events->listen(
            ProposalRevised::class,
            [self::class, 'handleProposalRevised'],
        );

        $events->listen(
            LpjApproved::class,
            [self::class, 'handleLpjApproved'],
        );
    }

    /**
     * Log a proposal approval action.
     */
    public function handleProposalApproved(ProposalApproved $event): void
    {
        ActivityLog::create([
            'user_id' => $event->approver->id,
            'aktivitas' => 'approval',
            'deskripsi' => "Menyetujui pengajuan {$event->pengajuan->nomor} pada tahap {$event->approval->stage->label()}",
            'model_type' => $event->pengajuan->getMorphClass(),
            'model_id' => $event->pengajuan->id,
            'data_baru' => [
                'status' => $event->approval->status->value,
                'stage' => $event->approval->stage->value,
                'catatan' => $event->approval->catatan,
                'approved_at' => $event->approval->approved_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Log a proposal revision action.
     */
    public function handleProposalRevised(ProposalRevised $event): void
    {
        ActivityLog::create([
            'user_id' => $event->approver->id,
            'aktivitas' => 'revision',
            'deskripsi' => "Merevisi pengajuan {$event->pengajuan->nomor} pada tahap {$event->approval->stage->label()}",
            'model_type' => $event->pengajuan->getMorphClass(),
            'model_id' => $event->pengajuan->id,
            'data_baru' => [
                'status' => $event->approval->status->value,
                'stage' => $event->approval->stage->value,
                'catatan' => $event->approval->catatan,
            ],
        ]);
    }

    /**
     * Log an LPJ approval action.
     */
    public function handleLpjApproved(LpjApproved $event): void
    {
        $approver = $event->approval->user;

        ActivityLog::create([
            'user_id' => $approver?->id,
            'aktivitas' => 'lpj_approval',
            'deskripsi' => "Menyetujui LPJ {$event->lpj->nomor} pada tahap {$event->approval->stage->label()}",
            'model_type' => $event->lpj->getMorphClass(),
            'model_id' => $event->lpj->id,
            'data_baru' => [
                'status' => $event->approval->status->value,
                'stage' => $event->approval->stage->value,
                'catatan' => $event->approval->catatan,
                'approved_at' => $event->approval->approved_at?->toISOString(),
            ],
        ]);
    }
}
