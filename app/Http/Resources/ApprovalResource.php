<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
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
            'approvable_type' => $this->approvable_type,
            'approvable_id' => $this->approvable_id,
            'stage' => $this->stage,
            'stage_order' => $this->stage_order,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'notes' => $this->notes,
            'approved_at' => $this->approved_at?->toISOString(),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'approvable' => $this->whenLoaded('approvable'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
