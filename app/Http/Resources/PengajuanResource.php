<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PengajuanResource extends JsonResource
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
            'unit_id' => $this->unit_id,
            'tahun_anggaran' => $this->tahun,
            'tahun' => $this->tahun,
            'nomor_pengajuan' => $this->nomor_pengajuan,
            'perihal' => $this->perihal,
            'nama_pengajuan' => $this->nama_pengajuan,
            'no_surat' => $this->no_surat,
            'tempat' => $this->tempat,
            'waktu_kegiatan' => $this->waktu_kegiatan,
            'jumlah_pengajuan_total' => $this->jumlah_pengajuan_total,
            'status_proses' => $this->status_proses,
            'current_approval_stage' => $this->current_approval_stage,
            'revision_requested_stage' => $this->revision_requested_stage,
            'status_revisi' => $this->status_revisi,
            'date_revisi' => $this->date_revisi,
            'time_revisi' => $this->time_revisi,
            'status_payment' => $this->status_payment,
            'no_voucher' => $this->no_voucher,
            'voucher_number' => $this->no_voucher,
            'print_status' => $this->print_status,
            'payment_recipient' => $this->payment_recipient,
            'payment_method' => $this->payment_method,
            'payment_notes' => $this->payment_notes,
            'paid_at' => $this->paid_at?->toISOString(),
            'paid_by' => new UserResource($this->whenLoaded('paidBy')),
            'amount_category' => $this->amount_category,
            'reference_type' => $this->reference_type,
            'need_lpj' => $this->need_lpj,
            'approved_amount' => $this->approved_amount,
            'submitter_type' => $this->submitter_type,
            'user' => new UserResource($this->whenLoaded('user')),
            'unit' => new UnitResource($this->whenLoaded('unitRelation')),
            'detail_pengajuans' => DetailPengajuanResource::collection($this->whenLoaded('detailPengajuans')),
            'approvals' => ApprovalResource::collection($this->whenLoaded('approvals')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'finance_validation' => $this->whenLoaded('financeValidation'),
            'discussions' => $this->whenLoaded('discussions'),
            'amount_edit_logs' => $this->whenLoaded('amountEditLogs'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
