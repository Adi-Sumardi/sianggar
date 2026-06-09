<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DetailMataAnggaran extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'detail_mata_anggarans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'mata_anggaran_id',
        'sub_mata_anggaran_id',
        'unit_id',
        'pkt_id',
        'tahun',
        'kode',
        'nama',
        'volume',
        'satuan',
        'harga_satuan',
        'jumlah',
        'keterangan',
        // Budget fields
        'anggaran_awal',
        'balance',
        'saldo_dipakai',
        'realisasi_year',
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
            'anggaran_awal' => 'decimal:2',
            'balance' => 'decimal:2',
            'saldo_dipakai' => 'decimal:2',
            'realisasi_year' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function mataAnggaran(): BelongsTo
    {
        return $this->belongsTo(MataAnggaran::class);
    }

    public function subMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(SubMataAnggaran::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function pkt(): BelongsTo
    {
        return $this->belongsTo(Pkt::class);
    }

    public function detailPengajuans(): HasMany
    {
        return $this->hasMany(DetailPengajuan::class);
    }

    public function lampiranMataAnggarans(): HasMany
    {
        return $this->hasMany(LampiranMataAnggaran::class);
    }

    // -------------------------------------------------------------------------
    // Sync hooks
    // -------------------------------------------------------------------------

    protected static function booted(): void
    {
        // When jumlah changes, sync all linked RapbsItems and recalculate totals.
        static::updated(function (DetailMataAnggaran $detail) {
            if (! $detail->wasChanged('jumlah')) {
                return;
            }

            $rapbsIds = RapbsItem::where('detail_mata_anggaran_id', $detail->id)
                ->pluck('rapbs_id')
                ->unique();

            RapbsItem::where('detail_mata_anggaran_id', $detail->id)
                ->update(['jumlah' => $detail->jumlah, 'harga_satuan' => $detail->jumlah]);

            Rapbs::whereIn('id', $rapbsIds)
                ->each(fn (Rapbs $rapbs) => $rapbs->recalculateTotal());
        });

        // When deleted, remove linked RapbsItems and recalculate totals.
        static::deleted(function (DetailMataAnggaran $detail) {
            $rapbsIds = RapbsItem::where('detail_mata_anggaran_id', $detail->id)
                ->pluck('rapbs_id')
                ->unique();

            RapbsItem::where('detail_mata_anggaran_id', $detail->id)->delete();

            Rapbs::whereIn('id', $rapbsIds)
                ->each(fn (Rapbs $rapbs) => $rapbs->recalculateTotal());
        });
    }
}
