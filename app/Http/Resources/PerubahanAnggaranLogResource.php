<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerubahanAnggaranLogResource extends JsonResource
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
            'perubahan_anggaran_item_id' => $this->perubahan_anggaran_item_id,
            'source_detail_mata_anggaran_id' => $this->source_detail_mata_anggaran_id,
            'target_detail_mata_anggaran_id' => $this->target_detail_mata_anggaran_id,
            'source_saldo_before' => $this->source_saldo_before,
            'source_saldo_after' => $this->source_saldo_after,
            'target_saldo_before' => $this->target_saldo_before,
            'target_saldo_after' => $this->target_saldo_after,
            'amount' => $this->amount,
            'executed_by' => $this->executed_by,
            'executed_at' => $this->executed_at?->toISOString(),
            'source_detail_mata_anggaran' => new DetailMataAnggaranResource(
                $this->whenLoaded('sourceDetailMataAnggaran')
            ),
            'target_detail_mata_anggaran' => new DetailMataAnggaranResource(
                $this->whenLoaded('targetDetailMataAnggaran')
            ),
            'executor' => new UserResource($this->whenLoaded('executor')),
            'log_entry' => $this->when(
                $this->relationLoaded('sourceDetailMataAnggaran') &&
                $this->relationLoaded('targetDetailMataAnggaran') &&
                $this->relationLoaded('executor'),
                fn () => $this->getLogEntry()
            ),
            'source_balance_change' => $this->getSourceBalanceChange(),
            'target_balance_change' => $this->getTargetBalanceChange(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
