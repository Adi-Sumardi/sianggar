<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RapbsItem extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'rapbs_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'rapbs_id',
        'pkt_id',
        'mata_anggaran_id',
        'sub_mata_anggaran_id',
        'detail_mata_anggaran_id',
        'kode_coa',
        'nama',
        'uraian',
        'volume',
        'satuan',
        'harga_satuan',
        'jumlah',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'volume' => 'decimal:2',
            'harga_satuan' => 'decimal:2',
            'jumlah' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function rapbs(): BelongsTo
    {
        return $this->belongsTo(Rapbs::class);
    }

    public function pkt(): BelongsTo
    {
        return $this->belongsTo(Pkt::class);
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

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Calculate and update jumlah based on volume and harga_satuan.
     */
    public function calculateJumlah(): void
    {
        $this->jumlah = (float) $this->volume * (float) $this->harga_satuan;
    }

    /**
     * Boot method for model events.
     */
    protected static function booted(): void
    {
        static::saving(function (RapbsItem $item) {
            // Auto-calculate jumlah if volume and harga_satuan are set
            if ($item->volume > 0 && $item->harga_satuan > 0) {
                $item->jumlah = (float) $item->volume * (float) $item->harga_satuan;
            }
        });

        static::saved(function (RapbsItem $item) {
            // Recalculate parent RAPBS total
            $item->rapbs->recalculateTotal();
        });

        static::deleted(function (RapbsItem $item) {
            // Recalculate parent RAPBS total
            $item->rapbs->recalculateTotal();
        });
    }
}
