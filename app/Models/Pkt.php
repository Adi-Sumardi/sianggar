<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Pkt extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'pkts';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'strategy_id',
        'indikator_id',
        'proker_id',
        'kegiatan_id',
        'mata_anggaran_id',
        'sub_mata_anggaran_id',
        'detail_mata_anggaran_id',
        'unit_id',
        'tahun',
        'unit',
        'deskripsi_kegiatan',
        'tujuan_kegiatan',
        'saldo_anggaran',
        'volume',
        'satuan',
        'created_by',
        'status',
        'catatan',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'saldo_anggaran' => 'decimal:2',
            'volume' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function strategy(): BelongsTo
    {
        return $this->belongsTo(Strategy::class);
    }

    public function indikator(): BelongsTo
    {
        return $this->belongsTo(Indikator::class);
    }

    public function proker(): BelongsTo
    {
        return $this->belongsTo(Proker::class);
    }

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }

    public function subMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(SubMataAnggaran::class);
    }

    public function detailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class);
    }

    public function unitRelation(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rapbsItems(): HasMany
    {
        return $this->hasMany(RapbsItem::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'model');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if PKT is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if PKT is submitted.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    /**
     * Get COA code for this PKT.
     */
    public function getCoaCode(): string
    {
        // Use the most specific kode available (each child already includes the parent prefix)
        if ($this->detailMataAnggaran) {
            return $this->detailMataAnggaran->kode;
        }
        if ($this->subMataAnggaran) {
            return $this->subMataAnggaran->kode;
        }
        if ($this->mataAnggaran) {
            return $this->mataAnggaran->kode;
        }

        return 'N/A';
    }
}
