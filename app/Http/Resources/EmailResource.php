<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailResource extends JsonResource
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
            'user_id' => $this->user_id,
            'name_surat' => $this->name_surat,
            'no_surat' => $this->no_surat,
            'isi_surat' => $this->isi_surat,
            'tgl_surat' => $this->tgl_surat,
            'status' => $this->status,
            'ditujukan' => $this->ditujukan,
            'status_arsip' => $this->status_arsip,
            'status_revisi' => $this->status_revisi,
            'user' => new UserResource($this->whenLoaded('user')),
            'recipients' => EmailRecipientResource::collection($this->whenLoaded('recipients')),
            'replies' => EmailReplyResource::collection($this->whenLoaded('replies')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
