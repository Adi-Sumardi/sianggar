<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MataAnggaranResource extends JsonResource
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
            'kode' => $this->kode,
            'nama' => $this->nama,
            'jenis' => $this->jenis,
            'keterangan' => $this->keterangan,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'sub_mata_anggarans' => SubMataAnggaranResource::collection($this->whenLoaded('subMataAnggarans')),
            'sub_mata_anggarans_count' => $this->whenCounted('subMataAnggarans'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
