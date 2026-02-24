<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode',
        'nama',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function mataAnggarans(): HasMany
    {
        return $this->hasMany(MataAnggaran::class);
    }

    public function subMataAnggarans(): HasMany
    {
        return $this->hasMany(SubMataAnggaran::class);
    }

    public function apbs(): HasMany
    {
        return $this->hasMany(Apbs::class);
    }

    public function penerimaans(): HasMany
    {
        return $this->hasMany(Penerimaan::class);
    }

    public function realisasiAnggarans(): HasMany
    {
        return $this->hasMany(RealisasiAnggaran::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function detailMataAnggarans(): HasMany
    {
        return $this->hasMany(DetailMataAnggaran::class);
    }
}
