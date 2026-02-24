<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetailPengajuanResource extends JsonResource
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
            'pengajuan_anggaran_id' => $this->pengajuan_anggaran_id,
            'detail_mata_anggaran_id' => $this->detail_mata_anggaran_id,
            'mata_anggaran_id' => $this->mata_anggaran_id,
            'sub_mata_anggaran_id' => $this->sub_mata_anggaran_id,
            'nama_item' => $this->nama_item,
            'uraian' => $this->uraian,
            'volume' => $this->volume,
            'satuan' => $this->satuan,
            'harga_satuan' => $this->harga_satuan,
            'jumlah' => $this->jumlah,
            'keterangan' => $this->keterangan,
            'detail_mata_anggaran' => new DetailMataAnggaranResource($this->whenLoaded('detailMataAnggaran')),
            'mata_anggaran' => new MataAnggaranResource($this->whenLoaded('mataAnggaran')),
            'sub_mata_anggaran' => new SubMataAnggaranResource($this->whenLoaded('subMataAnggaran')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
