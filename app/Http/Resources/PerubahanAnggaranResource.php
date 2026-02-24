<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerubahanAnggaranResource extends JsonResource
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
            'nomor_perubahan' => $this->nomor_perubahan,
            'user_id' => $this->user_id,
            'unit_id' => $this->unit_id,
            'tahun' => $this->tahun,
            'perihal' => $this->perihal,
            'alasan' => $this->alasan,
            'submitter_type' => $this->submitter_type,
            'status' => $this->status,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'current_approval_stage' => $this->current_approval_stage,
            'current_approval_stage_label' => $this->current_approval_stage?->label(),
            'total_amount' => $this->total_amount,
            'processed_at' => $this->processed_at?->toISOString(),
            'processed_by' => $this->processed_by,
            'user' => new UserResource($this->whenLoaded('user')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'unit' => new UnitResource($this->whenLoaded('unitRelation')),
            'processor' => new UserResource($this->whenLoaded('processor')),
            'items' => PerubahanAnggaranItemResource::collection($this->whenLoaded('items')),
            'logs' => PerubahanAnggaranLogResource::collection($this->whenLoaded('logs')),
            'approvals' => ApprovalResource::collection($this->whenLoaded('approvals')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'expected_stages' => $this->when(
                $this->relationLoaded('approvals'),
                fn () => $this->getExpectedStages()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
