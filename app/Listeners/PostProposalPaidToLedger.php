<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProposalFullyApproved;
use App\Models\User;
use App\Services\LedgerService;

class PostProposalPaidToLedger
{
    public function __construct(
        private LedgerService $ledgerService,
    ) {}

    /**
     * ProposalFullyApproved hanya di-dispatch di akhir workflow approval,
     * yaitu tepat setelah stage Payment disetujui (status_proses jadi
     * 'paid') — lihat ApprovalService::approve(). Posting jurnal di sini
     * (Debit Uang Muka Kegiatan / Kredit Dana Unit).
     */
    public function handle(ProposalFullyApproved $event): void
    {
        $postedBy = User::find($event->pengajuan->paid_by);

        $this->ledgerService->postFromPengajuanPaid($event->pengajuan, $postedBy);
    }
}
