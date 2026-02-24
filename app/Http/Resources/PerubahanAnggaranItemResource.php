<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerubahanAnggaranItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'perubahan_anggaran_id' => $this->perubahan_anggaran_id,
            'source_detail_mata_anggaran_id' => $this->source_detail_mata_anggaran_id,
            'target_detail_mata_anggaran_id' => $this->target_detail_mata_anggaran_id,
            'amount' => $this->amount,
            'keterangan' => $this->keterangan,
            'source_detail_mata_anggaran' => new DetailMataAnggaranResource(
                $this->whenLoaded('sourceDetailMataAnggaran')
            ),
            'target_detail_mata_anggaran' => new DetailMataAnggaranResource(
                $this->whenLoaded('targetDetailMataAnggaran')
            ),
            'transfer_summary' => $this->when(
                $this->relationLoaded('sourceDetailMataAnggaran') && $this->relationLoaded('targetDetailMataAnggaran'),
                fn () => $this->getTransferSummary()
            ),
            'has_enough_balance' => $this->when(
                $this->relationLoaded('sourceDetailMataAnggaran'),
                fn () => $this->hasEnoughSourceBalance()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
