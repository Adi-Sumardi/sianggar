<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LampiranMataAnggaran extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'lampiran_mata_anggarans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'detail_mata_anggaran_id',
        'sub_mata_anggaran_id',
        'mata_anggaran_id',
        'nama',
        'path',
        'mime_type',
        'ukuran',
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
            'ukuran' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function detailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class);
    }

    public function subMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(SubMataAnggaran::class);
    }

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }
}
