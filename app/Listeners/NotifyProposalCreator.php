<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProposalApproved;
use App\Events\ProposalFullyApproved;
use App\Events\ProposalRevised;
use App\Notifications\ProposalApprovedNotification;
use App\Notifications\ProposalRevisedNotification;
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
            ProposalApproved::class,
            [self::class, 'handleApproved'],
        );

        $events->listen(
            ProposalRevised::class,
            [self::class, 'handleRevised'],
        );

        $events->listen(
            ProposalFullyApproved::class,
            [self::class, 'handleFullyApproved'],
        );
    }

    /**
     * Notify the proposal creator that their proposal was approved at a stage.
     */
    public function handleApproved(ProposalApproved $event): void
    {
        $creator = $event->pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalApprovedNotification(
                pengajuan: $event->pengajuan,
                approver: $event->approver,
                stage: $event->approval->stage,
            ));
        }
    }

    /**
     * Notify the proposal creator that their proposal needs revision.
     */
    public function handleRevised(ProposalRevised $event): void
    {
        $creator = $event->pengajuan->user;

        if ($creator) {
            $creator->notify(new ProposalRevisedNotification(
                pengajuan: $event->pengajuan,
                approver: $event->approver,
                catatan: $event->approval->catatan ?? '',
            ));
        }
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
