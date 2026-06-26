<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProposalFullyApproved;
use App\Notifications\ProposalApprovedNotification;
use Illuminate\Events\Dispatcher;

class NotifyProposalCreator
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
            ProposalFullyApproved::class,
            [self::class, 'handleFullyApproved'],
        );
    }

    /**
     * Notify the proposal creator that their proposal is fully approved.
     */
    public function handleFullyApproved(ProposalFullyApproved $event): void
    {
        $creator = $event->pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalApprovedNotification(
                pengajuan: $event->pengajuan,
                approver: null,
                stage: null,
                isFullyApproved: true,
            ));
        }
    }
}
