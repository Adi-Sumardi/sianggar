<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\LpjApproved;
use App\Models\User;
use App\Services\LedgerService;

class PostLpjToLedger
{
    public function __construct(
        private LedgerService $ledgerService,
    ) {}

    /**
     * Handle the LpjApproved event by posting the realized expense to the
     * general ledger (Debit Beban / Kredit Dana Unit).
     */
    public function handle(LpjApproved $event): void
    {
        $approver = User::find($event->approval->approved_by);

        $this->ledgerService->postFromLpj($event->lpj, $approver);
    }
}
