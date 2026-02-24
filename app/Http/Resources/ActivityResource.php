<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
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
            'proker_id' => $this->proker_id,
            'unit_id' => $this->unit_id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'jenis_kegiatan' => $this->jenis_kegiatan,
            'keterangan' => $this->keterangan,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'strategy' => new StrategyResource($this->whenLoaded('strategy')),
            'indikator' => new IndicatorResource($this->whenLoaded('indikator')),
            'proker' => new ProkerResource($this->whenLoaded('proker')),
            'pkts' => PktResource::collection($this->whenLoaded('pkts')),
            'pkts_count' => $this->whenCounted('pkts'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
