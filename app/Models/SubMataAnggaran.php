<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubMataAnggaran extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'sub_mata_anggarans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'mata_anggaran_id',
        'unit_id',
        'kode',
        'nama',
        'keterangan',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function detailMataAnggarans(): HasMany
    {
        return $this->hasMany(DetailMataAnggaran::class);
    }

    public function lampiranMataAnggarans(): HasMany
    {
        return $this->hasMany(LampiranMataAnggaran::class);
    }
}
