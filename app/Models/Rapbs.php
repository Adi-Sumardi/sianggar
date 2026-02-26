<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Rapbs extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'rapbs';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_id',
        'tahun',
        'total_anggaran',
        'status',
        'current_approval_stage',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'keterangan',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_anggaran' => 'decimal:2',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'status' => RapbsStatus::class,
            'current_approval_stage' => RapbsApprovalStage::class,
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RapbsItem::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(RapbsApproval::class)->orderBy('stage_order');
    }

    public function currentApproval(): HasOne
    {
        return $this->hasOne(RapbsApproval::class)
            ->where('status', 'pending')
            ->orderBy('stage_order');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function apbs(): HasOne
    {
        return $this->hasOne(Apbs::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    public function revisionComments(): MorphMany
    {
        return $this->morphMany(RevisionComment::class, 'commentable');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Recalculate total anggaran from items.
     */
    public function recalculateTotal(): void
    {
        $this->total_anggaran = $this->items()->sum('jumlah');
        $this->save();
    }

    /**
     * Get total plafon for this RAPBS's unit.
     * Plafon = sum of (asumsi_realisasi * 1.05) for each mata anggaran.
     */
    public function getTotalPlafon(): float
    {
        if (!$this->relationLoaded('unit') || !$this->unit) {
            return 0.0;
        }

        $mataAnggarans = $this->unit->relationLoaded('mataAnggarans')
            ? $this->unit->mataAnggarans
            : $this->unit->mataAnggarans()->get();

        return (float) $mataAnggarans->sum(function (MataAnggaran $ma) {
            return (float) $ma->asumsi_realisasi * 1.05;
        });
    }

    /**
     * Check if total anggaran exceeds total plafon.
     */
    public function isOverBudget(): bool
    {
        $plafon = $this->getTotalPlafon();

        return $plafon > 0 && (float) $this->total_anggaran > $plafon;
    }

    /**
     * Check if RAPBS can be edited.
     */
    public function canEdit(): bool
    {
        return $this->status->canEdit();
    }

    /**
     * Check if RAPBS can be submitted.
     */
    public function canSubmit(): bool
    {
        return $this->status->canSubmit() && $this->items()->count() > 0;
    }

    /**
     * Get the expected approval flow based on submitter.
     *
     * @return array<int, RapbsApprovalStage>
     */
    public function getExpectedFlow(): array
    {
        $isUnit = $this->submitter?->role->isUnit() ?? true;

        return $isUnit
            ? RapbsApprovalStage::unitFlow()
            : RapbsApprovalStage::substansiFlow();
    }
}
