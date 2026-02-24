<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailRecipientResource extends JsonResource
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
            'email_id' => $this->email_id,
            'user_id' => $this->user_id,
            'role' => $this->role,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toISOString(),
            'display_name' => $this->display_name,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
