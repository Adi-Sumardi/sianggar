<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProkerResource extends JsonResource
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
            'strategy_id' => $this->strategy_id,
            'indikator_id' => $this->indikator_id,
            'unit_id' => $this->unit_id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'keterangan' => $this->keterangan,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'strategy' => new StrategyResource($this->whenLoaded('strategy')),
            'indikator' => new IndicatorResource($this->whenLoaded('indikator')),
            'kegiatans' => ActivityResource::collection($this->whenLoaded('kegiatans')),
            'kegiatans_count' => $this->whenCounted('kegiatans'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
