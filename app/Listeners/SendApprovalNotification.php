<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\UserRole;
use App\Events\ProposalApproved;
use App\Events\ProposalRevised;
use App\Models\User;
use App\Notifications\NewProposalNotification;
use App\Notifications\ProposalRevisedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Events\Dispatcher;

class SendApprovalNotification implements ShouldQueue
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
            [self::class, 'handleApproved'],
        );

        $events->listen(
            ProposalRevised::class,
            [self::class, 'handleRevised'],
        );
    }

    /**
     * Handle the ProposalApproved event.
     *
     * Find the next approver based on the current approval stage and
     * send them a notification that a new proposal awaits their review.
     */
    public function handleApproved(ProposalApproved $event): void
    {
        $pengajuan = $event->pengajuan;
        $currentStage = $event->approval->stage;

        // Determine the next approval stage
        $nextStage = $currentStage->next();

        if ($nextStage === null) {
            // No next stage means fully approved; handled by other listeners.
            return;
        }

        // Find the user who has the required role for the next stage
        $requiredRole = $nextStage->requiredRole();
        $nextApprover = User::where('role', $requiredRole->value)->first();

        if ($nextApprover) {
            $nextApprover->notify(new NewProposalNotification(
                pengajuan: $pengajuan,
                stage: $nextStage,
            ));
        }
    }

    /**
     * Handle the ProposalRevised event.
     *
     * Send a notification to the proposal creator informing them
     * that their proposal needs revision.
     */
    public function handleRevised(ProposalRevised $event): void
    {
        $pengajuan = $event->pengajuan;
        $creator = $pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalRevisedNotification(
                pengajuan: $pengajuan,
                approver: $event->approver,
                catatan: $event->approval->catatan ?? '',
            ));
        }
    }
}
