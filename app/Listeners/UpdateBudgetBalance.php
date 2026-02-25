<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProposalFullyApproved;
use Illuminate\Support\Facades\Log;

class UpdateBudgetBalance
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the ProposalFullyApproved event.
     *
     * Budget is already reserved at submit time (bank-like system).
     * This listener only logs the confirmation — no additional deduction needed.
     */
    public function handle(ProposalFullyApproved $event): void
    {
        $pengajuan = $event->pengajuan;

        Log::info('Proposal fully approved — budget already reserved at submission', [
            'pengajuan_id' => $pengajuan->id,
            'jumlah_total' => $pengajuan->jumlah_pengajuan_total,
        ]);
    }
}
