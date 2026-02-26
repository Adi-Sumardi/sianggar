<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LpjApprovalStage;
use App\Enums\LpjStatus;
use App\Enums\ReferenceType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Lpj extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'lpjs';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pengajuan_anggaran_id',
        'unit',
        'no_surat',
        'mata_anggaran',
        'perihal',
        'no_mata_anggaran',
        'jumlah_pengajuan_total',
        'tgl_kegiatan',
        'input_realisasi',
        'deskripsi_singkat',
        'proses',
        'current_approval_stage',
        'revision_requested_stage',
        'status_revisi',
        'tahun',
        'ditujukan',
        // Routing fields
        'reference_type',
        'validated_at',
        'validated_by',
        'validation_notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_kegiatan' => 'date',
            'jumlah_pengajuan_total' => 'decimal:2',
            'input_realisasi' => 'decimal:2',
            'proses' => LpjStatus::class,
            'current_approval_stage' => LpjApprovalStage::class,
            'reference_type' => ReferenceType::class,
            'validated_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function pengajuanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PengajuanAnggaran::class);
    }

    public function approvals(): MorphMany
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * Get the validation record for this LPJ (created by Staf Keuangan).
     */
    public function validation(): HasOne
    {
        return $this->hasOne(LpjValidation::class);
    }

    /**
     * Get the user who validated this LPJ.
     */
    public function validatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function revisionComments(): MorphMany
    {
        return $this->morphMany(RevisionComment::class, 'commentable');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByStatus(Builder $query, LpjStatus $status): Builder
    {
        return $query->where('proses', $status->value);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('proses', LpjStatus::Draft->value);
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('proses', LpjStatus::Submitted->value);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('proses', LpjStatus::Approved->value);
    }

    public function scopePendingApproval(Builder $query): Builder
    {
        return $query->whereIn('proses', [
            LpjStatus::Submitted->value,
            LpjStatus::Validated->value,
            LpjStatus::ApprovedByMiddle->value,
        ]);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    /**
     * Get the expected approval stages for this LPJ.
     *
     * @return list<LpjApprovalStage>
     */
    public function getExpectedStages(): array
    {
        $stages = [LpjApprovalStage::StaffKeuangan];

        // Middle approver based on reference_type
        if ($this->reference_type !== null) {
            $stages[] = LpjApprovalStage::fromReferenceType($this->reference_type);
        }

        $stages[] = LpjApprovalStage::Keuangan;

        return $stages;
    }

    /**
     * Check if this LPJ can be edited.
     */
    public function canBeEdited(): bool
    {
        return $this->proses?->isEditable() ?? true;
    }

    /**
     * Check if this LPJ is in final state.
     */
    public function isFinal(): bool
    {
        return $this->proses?->isFinal() ?? false;
    }

    /**
     * Get the current approval for this LPJ.
     */
    public function getCurrentApproval(): ?Approval
    {
        if ($this->current_approval_stage === null) {
            return null;
        }

        return $this->approvals()
            ->where('stage', $this->current_approval_stage->value)
            ->latest()
            ->first();
    }
}
