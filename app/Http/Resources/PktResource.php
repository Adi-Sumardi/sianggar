<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PktResource extends JsonResource
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
            'kegiatan_id' => $this->kegiatan_id,
            'mata_anggaran_id' => $this->mata_anggaran_id,
            'sub_mata_anggaran_id' => $this->sub_mata_anggaran_id,
            'detail_mata_anggaran_id' => $this->detail_mata_anggaran_id,
            'unit_id' => $this->unit_id,
            'tahun' => $this->tahun,
            'unit' => $this->unit, // Legacy string field
            'deskripsi_kegiatan' => $this->deskripsi_kegiatan,
            'tujuan_kegiatan' => $this->tujuan_kegiatan,
            'saldo_anggaran' => (float) ($this->saldo_anggaran ?? 0),
            'volume' => (float) ($this->volume ?? 1),
            'satuan' => $this->satuan ?? 'paket',
            'status' => $this->status ?? 'draft',
            'catatan' => $this->catatan,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Computed
            'kode_coa' => method_exists($this->resource, 'getCoaCode') ? $this->getCoaCode() : null,

            // Relations
            'strategy' => $this->whenLoaded('strategy', fn () => [
                'id' => $this->strategy->id,
                'kode' => $this->strategy->kode,
                'nama' => $this->strategy->nama,
            ]),
            'indikator' => $this->whenLoaded('indikator', fn () => [
                'id' => $this->indikator->id,
                'kode' => $this->indikator->kode,
                'nama' => $this->indikator->nama,
            ]),
            'proker' => $this->whenLoaded('proker', fn () => [
                'id' => $this->proker->id,
                'kode' => $this->proker->kode,
                'nama' => $this->proker->nama,
            ]),
            'kegiatan' => $this->whenLoaded('kegiatan', fn () => [
                'id' => $this->kegiatan->id,
                'kode' => $this->kegiatan->kode,
                'nama' => $this->kegiatan->nama,
            ]),
            'mata_anggaran' => $this->whenLoaded('mataAnggaran', fn () => [
                'id' => $this->mataAnggaran->id,
                'kode' => $this->mataAnggaran->kode,
                'nama' => $this->mataAnggaran->nama,
            ]),
            'sub_mata_anggaran' => $this->whenLoaded('subMataAnggaran', fn () => $this->subMataAnggaran ? [
                'id' => $this->subMataAnggaran->id,
                'kode' => $this->subMataAnggaran->kode,
                'nama' => $this->subMataAnggaran->nama,
            ] : null),
            'detail_mata_anggaran' => $this->whenLoaded('detailMataAnggaran', fn () => $this->detailMataAnggaran ? [
                'id' => $this->detailMataAnggaran->id,
                'kode' => $this->detailMataAnggaran->kode,
                'nama' => $this->detailMataAnggaran->nama,
            ] : null),
            'unit_relation' => $this->whenLoaded('unitRelation', fn () => $this->unitRelation ? [
                'id' => $this->unitRelation->id,
                'kode' => $this->unitRelation->kode,
                'nama' => $this->unitRelation->nama,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
        ];
    }
}
