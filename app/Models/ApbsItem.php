<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApbsItem extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'apbs_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'apbs_id',
        'rapbs_item_id',
        'mata_anggaran_id',
        'detail_mata_anggaran_id',
        'kode_coa',
        'nama',
        'anggaran',
        'realisasi',
        'sisa',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'anggaran' => 'decimal:2',
            'realisasi' => 'decimal:2',
            'sisa' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function apbs(): BelongsTo
    {
        return $this->belongsTo(Apbs::class);
    }

    public function rapbsItem(): BelongsTo
    {
        return $this->belongsTo(RapbsItem::class);
    }

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }

    public function detailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Recalculate sisa based on anggaran and realisasi.
     */
    public function recalculateSisa(): void
    {
        $this->sisa = (float) $this->anggaran - (float) $this->realisasi;
        $this->save();
    }

    /**
     * Get percentage of realization.
     */
    public function getRealisasiPercentage(): float
    {
        if ((float) $this->anggaran === 0.0) {
            return 0;
        }

        return ((float) $this->realisasi / (float) $this->anggaran) * 100;
    }
}
