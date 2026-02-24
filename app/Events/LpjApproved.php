<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Approval;
use App\Models\Lpj;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LpjApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly Lpj $lpj,
        public readonly Approval $approval,
    ) {}
}
