<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapbsApprovalResource extends JsonResource
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
            'user_id' => $this->user_id,
            'stage' => $this->stage?->value,
            'stage_label' => $this->stage?->label(),
            'stage_order' => $this->stage_order,
            'status' => $this->status,
            'notes' => $this->notes,
            'acted_at' => $this->acted_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relations
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'role' => $this->user->role->value,
                'role_label' => $this->user->role->label(),
            ]),
        ];
    }
}
