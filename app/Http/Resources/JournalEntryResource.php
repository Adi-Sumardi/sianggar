<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalEntryResource extends JsonResource
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
            'ulid' => $this->ulid,
            'tanggal' => $this->tanggal?->toDateString(),
            'no_bukti' => $this->no_bukti,
            'journal_id' => $this->journal_id,
            'journal' => new JournalResource($this->whenLoaded('journal')),
            'unit_id' => $this->unit_id,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'sumber_type' => $this->sumber_type,
            'sumber_id' => $this->sumber_id,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'keterangan' => $this->keterangan,
            'reversal_of_id' => $this->reversal_of_id,
            'posted_at' => $this->posted_at?->toISOString(),
            'total_debit' => $this->whenLoaded('items', fn () => $this->items->sum('debit')),
            'total_kredit' => $this->whenLoaded('items', fn () => $this->items->sum('kredit')),
            'items' => JournalItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
