<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapbsResource extends JsonResource
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
            'unit_id' => $this->unit_id,
            'tahun' => $this->tahun,
            'total_anggaran' => (float) $this->total_anggaran,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'current_approval_stage' => $this->current_approval_stage?->value,
            'current_approval_stage_label' => $this->current_approval_stage?->label(),
            'submitted_by' => $this->submitted_by,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'keterangan' => $this->keterangan,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relations
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit->id,
                'kode' => $this->unit->kode,
                'nama' => $this->unit->nama,
            ]),
            'items' => RapbsItemResource::collection($this->whenLoaded('items')),
            'approvals' => RapbsApprovalResource::collection($this->whenLoaded('approvals')),
            'current_approval' => $this->whenLoaded('currentApproval', fn () => new RapbsApprovalResource($this->currentApproval)),
            'submitter' => $this->whenLoaded('submitter', fn () => [
                'id' => $this->submitter->id,
                'name' => $this->submitter->name,
                'role' => $this->submitter->role->value,
                'role_label' => $this->submitter->role->label(),
            ]),
            'approver' => $this->whenLoaded('approver', fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),

            // Computed
            'items_count' => $this->whenCounted('items'),
            'can_edit' => $this->canEdit(),
            'can_submit' => $this->canSubmit(),
            'total_plafon' => $this->getTotalPlafon(),
            'is_over_budget' => $this->isOverBudget(),
            'expected_flow' => collect($this->getExpectedFlow())->map(fn ($stage) => [
                'value' => $stage->value,
                'label' => $stage->label(),
            ])->toArray(),
        ];
    }
}
