<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubMataAnggaranResource extends JsonResource
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
            'mata_anggaran_id' => $this->mata_anggaran_id,
            'unit_id' => $this->unit_id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'keterangan' => $this->keterangan,
            'mata_anggaran' => new MataAnggaranResource($this->whenLoaded('mataAnggaran')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'detail_mata_anggarans' => DetailMataAnggaranResource::collection($this->whenLoaded('detailMataAnggarans')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
