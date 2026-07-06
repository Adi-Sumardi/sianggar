<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttachmentResource extends JsonResource
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
            'attachable_type' => $this->attachable_type,
            'attachable_id' => $this->attachable_id,
            // Use frontend-friendly names that map to database columns
            'nama' => $this->file_name,
            // Kembalikan URL publik yang benar. file_path disimpan relatif
            // (mis. "pengajuan/5/xxx.pdf"); frontend memakainya langsung sebagai
            // src/href, jadi harus jadi "/storage/..." agar tidak salah resolve.
            'path' => $this->publicUrl(),
            'mime_type' => $this->file_mime,
            'size' => $this->file_size,
            'uploaded_by' => $this->uploaded_by,
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Bangun URL publik dari file_path (relatif ke disk 'public').
     * Aman jika file_path sudah berupa URL absolut atau sudah diawali /storage.
     */
    private function publicUrl(): ?string
    {
        $path = $this->file_path;

        if (empty($path)) {
            return null;
        }

        if (preg_match('#^https?://#', $path) || str_starts_with($path, '/storage')) {
            return $path;
        }

        return '/storage/' . ltrim($path, '/');
    }
}
