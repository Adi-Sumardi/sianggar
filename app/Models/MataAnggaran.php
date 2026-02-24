<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MataAnggaran extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'mata_anggarans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_id',
        'no_mata_anggaran_id',
        'kode',
        'nama',
        'tahun',
        'jenis',
        'keterangan',
        'apbs_tahun_lalu',
        'asumsi_realisasi',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['plafon_apbs'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'apbs_tahun_lalu' => 'decimal:2',
            'asumsi_realisasi' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Get the calculated plafon APBS (asumsi_realisasi * 1.05).
     */
    public function getPlafonApbsAttribute(): float
    {
        return (float) $this->asumsi_realisasi * 1.05;
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function noMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(NoMataAnggaran::class);
    }

    public function subMataAnggarans(): HasMany
    {
        return $this->hasMany(SubMataAnggaran::class);
    }

    public function detailMataAnggarans(): HasMany
    {
        return $this->hasMany(DetailMataAnggaran::class);
    }

    public function detailPengajuans(): HasMany
    {
        return $this->hasMany(DetailPengajuan::class);
    }

    public function lampiranMataAnggarans(): HasMany
    {
        return $this->hasMany(LampiranMataAnggaran::class);
    }
}
