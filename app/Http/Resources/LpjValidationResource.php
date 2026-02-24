<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for LPJ Validation data.
 *
 * @mixin \App\Models\LpjValidation
 */
class LpjValidationResource extends JsonResource
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
            'lpj_id' => $this->lpj_id,
            'validated_by' => $this->validated_by,

            // Checklist items
            'has_activity_identity' => $this->has_activity_identity,
            'has_cover_letter' => $this->has_cover_letter,
            'has_narrative_report' => $this->has_narrative_report,
            'has_financial_report' => $this->has_financial_report,
            'has_receipts' => $this->has_receipts,

            // Derived values
            'is_complete' => $this->isComplete(),
            'checked_count' => $this->getCheckedCount(),
            'total_items' => self::getTotalItems(),

            // Routing
            'reference_type' => $this->reference_type,
            'reference_type_label' => $this->reference_type?->label(),

            'notes' => $this->notes,
            'validator' => new UserResource($this->whenLoaded('validator')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
