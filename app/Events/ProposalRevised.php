<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Approval;
use App\Models\PengajuanAnggaran;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalRevised
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly PengajuanAnggaran $pengajuan,
        public readonly Approval $approval,
        public readonly User $approver,
    ) {}
}
