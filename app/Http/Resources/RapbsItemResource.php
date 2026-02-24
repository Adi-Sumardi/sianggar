<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapbsItemResource extends JsonResource
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
            'rapbs_id' => $this->rapbs_id,
            'pkt_id' => $this->pkt_id,
            'mata_anggaran_id' => $this->mata_anggaran_id,
            'sub_mata_anggaran_id' => $this->sub_mata_anggaran_id,
            'detail_mata_anggaran_id' => $this->detail_mata_anggaran_id,
            'kode_coa' => $this->kode_coa,
            'nama' => $this->nama,
            'uraian' => $this->uraian,
            'volume' => (float) $this->volume,
            'satuan' => $this->satuan,
            'harga_satuan' => (float) $this->harga_satuan,
            'jumlah' => (float) $this->jumlah,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relations
            'pkt' => $this->whenLoaded('pkt', fn () => new PktResource($this->pkt)),
            'mata_anggaran' => $this->whenLoaded('mataAnggaran', fn () => [
                'id' => $this->mataAnggaran->id,
                'kode' => $this->mataAnggaran->kode,
                'nama' => $this->mataAnggaran->nama,
            ]),
            'sub_mata_anggaran' => $this->whenLoaded('subMataAnggaran', fn () => [
                'id' => $this->subMataAnggaran->id,
                'kode' => $this->subMataAnggaran->kode,
                'nama' => $this->subMataAnggaran->nama,
            ]),
            'detail_mata_anggaran' => $this->whenLoaded('detailMataAnggaran', fn () => [
                'id' => $this->detailMataAnggaran->id,
                'kode' => $this->detailMataAnggaran->kode,
                'nama' => $this->detailMataAnggaran->nama,
            ]),
        ];
    }
}
