<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApbsResource extends JsonResource
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
            'rapbs_id' => $this->rapbs_id,
            'tahun' => $this->tahun,
            'total_anggaran' => $this->total_anggaran,
            'total_realisasi' => $this->total_realisasi,
            'sisa_anggaran' => $this->sisa_anggaran,
            'nomor_dokumen' => $this->nomor_dokumen,
            'status' => $this->status,
            'keterangan' => $this->keterangan,
            'tanggal_pengesahan' => $this->tanggal_pengesahan?->format('Y-m-d'),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'rapbs' => new RapbsResource($this->whenLoaded('rapbs')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
