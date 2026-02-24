<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Apbs extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'apbs';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_id',
        'rapbs_id',
        'tahun',
        'total_anggaran',
        'total_realisasi',
        'sisa_anggaran',
        'nomor_dokumen',
        'tanggal_pengesahan',
        'status',
        'keterangan',
        'ttd_kepala_sekolah',
        'ttd_bendahara',
        'ttd_ketua_umum',
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
            'total_realisasi' => 'decimal:2',
            'sisa_anggaran' => 'decimal:2',
            'tanggal_pengesahan' => 'date',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function rapbs(): BelongsTo
    {
        return $this->belongsTo(Rapbs::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ApbsItem::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'model');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if APBS is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if APBS is closed.
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Recalculate totals from items.
     */
    public function recalculateTotals(): void
    {
        $this->total_anggaran = $this->items()->sum('anggaran');
        $this->total_realisasi = $this->items()->sum('realisasi');
        $this->sisa_anggaran = (float) $this->total_anggaran - (float) $this->total_realisasi;
        $this->save();
    }

    /**
     * Get realization percentage.
     */
    public function getRealisasiPercentage(): float
    {
        if ((float) $this->total_anggaran === 0.0) {
            return 0;
        }

        return ((float) $this->total_realisasi / (float) $this->total_anggaran) * 100;
    }
}
