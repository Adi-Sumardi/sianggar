<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProposalFullyApproved;
use App\Models\DetailMataAnggaran;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateBudgetBalance implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the ProposalFullyApproved event.
     *
     * Update the detail_mata_anggaran records by increasing saldo_dipakai
     * and recalculating the balance based on the approved pengajuan details.
     */
    public function handle(ProposalFullyApproved $event): void
    {
        $pengajuan = $event->pengajuan->load('detailPengajuans');

        DB::transaction(function () use ($pengajuan) {
            foreach ($pengajuan->detailPengajuans as $detail) {
                if (! $detail->detail_mata_anggaran_id) {
                    continue;
                }

                $detailMataAnggaran = DetailMataAnggaran::find($detail->detail_mata_anggaran_id);

                if (! $detailMataAnggaran) {
                    Log::warning('DetailMataAnggaran not found', [
                        'detail_mata_anggaran_id' => $detail->detail_mata_anggaran_id,
                        'pengajuan_id' => $pengajuan->id,
                    ]);

                    continue;
                }

                // Increase the amount used
                $currentSaldoDigunakan = (float) ($detailMataAnggaran->saldo_dipakai ?? 0);
                $amount = (float) $detail->jumlah;

                $detailMataAnggaran->update([
                    'saldo_dipakai' => $currentSaldoDigunakan + $amount,
                ]);

                Log::info('Budget balance updated', [
                    'detail_mata_anggaran_id' => $detailMataAnggaran->id,
                    'pengajuan_id' => $pengajuan->id,
                    'amount_added' => $amount,
                    'new_saldo_dipakai' => $currentSaldoDigunakan + $amount,
                ]);
            }
        });
    }
}
