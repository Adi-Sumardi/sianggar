<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisMataAnggaran extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode',
        'nama',
        'keterangan',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get mata anggarans with this jenis.
     */
    public function mataAnggarans(): HasMany
    {
        return $this->hasMany(MataAnggaran::class, 'jenis', 'kode');
    }

    /**
     * Scope for active jenis only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
