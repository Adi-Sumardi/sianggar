<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StrategyResource extends JsonResource
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
            'kode' => $this->kode,
            'nama' => $this->nama,
            'keterangan' => $this->keterangan,
            'indikators' => IndicatorResource::collection($this->whenLoaded('indikators')),
            'prokers' => ProkerResource::collection($this->whenLoaded('prokers')),
            'indikators_count' => $this->whenCounted('indikators'),
            'prokers_count' => $this->whenCounted('prokers'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
