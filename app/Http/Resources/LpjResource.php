<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\LpjStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for LPJ (Laporan Pertanggungjawaban) data.
 *
 * @mixin \App\Models\Lpj
 */
class LpjResource extends JsonResource
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
            'pengajuan_anggaran_id' => $this->pengajuan_anggaran_id,
            'unit' => $this->unit,
            'no_surat' => $this->no_surat,
            'mata_anggaran' => $this->mata_anggaran,
            'perihal' => $this->perihal,
            'no_mata_anggaran' => $this->no_mata_anggaran,
            'jumlah_pengajuan_total' => $this->jumlah_pengajuan_total,
            'tgl_kegiatan' => $this->tgl_kegiatan?->toISOString(),
            'input_realisasi' => $this->input_realisasi,
            'deskripsi_singkat' => $this->deskripsi_singkat,

            // Status
            'proses' => $this->proses,
            'proses_label' => $this->proses?->label(),
            'proses_color' => $this->proses?->color(),
            'is_editable' => $this->canBeEdited(),
            'is_final' => $this->isFinal(),

            // Approval stage
            'current_approval_stage' => $this->current_approval_stage,
            'current_approval_stage_label' => $this->current_approval_stage?->label(),
            'status_revisi' => $this->status_revisi,

            // Routing
            'reference_type' => $this->reference_type,
            'reference_type_label' => $this->reference_type?->label(),

            // Validation info
            'validated_at' => $this->validated_at?->toISOString(),
            'validated_by' => $this->validated_by,
            'validation_notes' => $this->validation_notes,
            'validated_by_user' => new UserResource($this->whenLoaded('validatedByUser')),

            'tahun' => $this->tahun,
            'ditujukan' => $this->ditujukan,

            // Relations
            'pengajuan_anggaran' => new PengajuanResource($this->whenLoaded('pengajuanAnggaran')),
            'approvals' => ApprovalResource::collection($this->whenLoaded('approvals')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'validation' => new LpjValidationResource($this->whenLoaded('validation')),

            // Expected approval stages
            'expected_stages' => $this->getExpectedStages(),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
