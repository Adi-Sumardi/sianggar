<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proker extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'strategy_id',
        'indikator_id',
        'unit_id',
        'kode',
        'nama',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function strategy(): BelongsTo
    {
        return $this->belongsTo(Strategy::class);
    }

    public function indikator(): BelongsTo
    {
        return $this->belongsTo(Indikator::class);
    }

    public function kegiatans(): HasMany
    {
        return $this->hasMany(Kegiatan::class);
    }

    public function pkts(): HasMany
    {
        return $this->hasMany(Pkt::class);
    }
}
