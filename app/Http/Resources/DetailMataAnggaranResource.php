<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetailMataAnggaranResource extends JsonResource
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
            'sub_mata_anggaran_id' => $this->sub_mata_anggaran_id,
            'unit_id' => $this->unit_id,
            'pkt_id' => $this->pkt_id,
            'tahun' => $this->tahun,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'volume' => $this->volume,
            'satuan' => $this->satuan,
            'harga_satuan' => $this->harga_satuan,
            'jumlah' => $this->jumlah,
            'keterangan' => $this->keterangan,
            // Budget fields
            'anggaran_awal' => $this->anggaran_awal,
            'saldo_dipakai' => $this->saldo_dipakai,
            'saldo_tersedia' => $this->balance,
            'realisasi' => $this->realisasi_year,
            // Relations
            'mata_anggaran' => new MataAnggaranResource($this->whenLoaded('mataAnggaran')),
            'sub_mata_anggaran' => new SubMataAnggaranResource($this->whenLoaded('subMataAnggaran')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'pkt' => new PktResource($this->whenLoaded('pkt')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
