<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PenerimaanResource extends JsonResource
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
            'unit_id' => $this->unit_id,
            'tahun' => $this->tahun,
            'bulan' => $this->bulan,
            'sumber' => $this->sumber,
            'jumlah' => $this->jumlah,
            'keterangan' => $this->keterangan,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
