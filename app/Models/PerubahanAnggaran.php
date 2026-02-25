<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ApprovalStage;
use App\Enums\PerubahanAnggaranStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class PerubahanAnggaran extends Model
{
    use HasFactory;

    protected $table = 'perubahan_anggarans';

    protected $fillable = [
        'nomor_perubahan',
        'user_id',
        'unit_id',
        'tahun',
        'perihal',
        'alasan',
        'submitter_type',
        'status',
        'current_approval_stage',
        'total_amount',
        'processed_at',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'status' => PerubahanAnggaranStatus::class,
            'current_approval_stage' => ApprovalStage::class,
            'processed_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function unitRelation(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PerubahanAnggaranItem::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PerubahanAnggaranLog::class);
    }

    public function approvals(): MorphMany
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function revisionComments(): MorphMany
    {
        return $this->morphMany(RevisionComment::class, 'commentable');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByStatus(Builder $query, PerubahanAnggaranStatus $status): Builder
    {
        return $query->where('status', $status->value);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', PerubahanAnggaranStatus::Draft->value);
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('status', PerubahanAnggaranStatus::Submitted->value);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereNotIn('status', [
            PerubahanAnggaranStatus::Rejected->value,
            PerubahanAnggaranStatus::Processed->value,
        ]);
    }

    public function scopeByYear(Builder $query, string $tahun): Builder
    {
        return $query->where('tahun', $tahun);
    }

    public function scopeByUnit(Builder $query, int $unitId): Builder
    {
        return $query->where('unit_id', $unitId);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function isEditable(): bool
    {
        return $this->status->isEditable();
    }

    public function isSubmittable(): bool
    {
        return $this->status->isSubmittable();
    }

    public function isFinal(): bool
    {
        return $this->status->isFinal();
    }

    public function isProcessed(): bool
    {
        return $this->status === PerubahanAnggaranStatus::Processed;
    }

    public function calculateTotalAmount(): float
    {
        return (float) $this->items()->sum('amount');
    }

    public function updateTotalAmount(): void
    {
        $this->update(['total_amount' => $this->calculateTotalAmount()]);
    }

    /**
     * Get the expected approval stages based on submitter type.
     *
     * @return array<ApprovalStage>
     */
    public function getExpectedStages(): array
    {
        if ($this->submitter_type === 'unit') {
            return [
                ApprovalStage::Direktur,
                ApprovalStage::WakilKetua,
                ApprovalStage::Ketum,
                ApprovalStage::Keuangan,
                ApprovalStage::Bendahara,
            ];
        }

        return [
            ApprovalStage::KabagSekretariat,
            ApprovalStage::Sekretaris,
            ApprovalStage::Ketum,
            ApprovalStage::Keuangan,
            ApprovalStage::Bendahara,
        ];
    }

    /**
     * Get the initial approval stage based on submitter type.
     */
    public function getInitialStage(): ApprovalStage
    {
        return $this->submitter_type === 'unit'
            ? ApprovalStage::Direktur
            : ApprovalStage::KabagSekretariat;
    }
}
