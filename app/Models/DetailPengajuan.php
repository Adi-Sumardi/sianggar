<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailPengajuan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'detail_pengajuans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pengajuan_anggaran_id',
        'detail_mata_anggaran_id',
        'mata_anggaran_id',
        'sub_mata_anggaran_id',
        'uraian',
        'volume',
        'satuan',
        'harga_satuan',
        'jumlah',
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
            'volume' => 'decimal:2',
            'harga_satuan' => 'decimal:2',
            'jumlah' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function pengajuanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PengajuanAnggaran::class);
    }

    public function detailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class);
    }

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }

    public function subMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(SubMataAnggaran::class);
    }
}
