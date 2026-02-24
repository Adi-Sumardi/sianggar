<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerubahanAnggaranItem extends Model
{
    use HasFactory;

    protected $table = 'perubahan_anggaran_items';

    protected $fillable = [
        'perubahan_anggaran_id',
        'type',
        'source_detail_mata_anggaran_id',
        'target_detail_mata_anggaran_id',
        'amount',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function perubahanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PerubahanAnggaran::class);
    }

    public function sourceDetailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class, 'source_detail_mata_anggaran_id');
    }

    public function targetDetailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class, 'target_detail_mata_anggaran_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PerubahanAnggaranLog::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if source budget has sufficient balance for this transfer.
     * For 'tambah' type, this always returns true as no source balance is needed.
     */
    public function hasEnoughSourceBalance(): bool
    {
        // For 'tambah' type, no source balance check needed
        if ($this->type === 'tambah') {
            return true;
        }

        $source = $this->sourceDetailMataAnggaran;
        if (! $source) {
            return false;
        }

        return (float) $source->balance >= (float) $this->amount;
    }

    /**
     * Get the formatted transfer summary.
     */
    public function getTransferSummary(): string
    {
        $target = $this->targetDetailMataAnggaran;
        $amount = number_format((float) $this->amount, 0, ',', '.');

        if ($this->type === 'tambah') {
            return sprintf(
                'Tambah ke %s: Rp %s',
                $target?->nama ?? 'Unknown',
                $amount
            );
        }

        $source = $this->sourceDetailMataAnggaran;

        return sprintf(
            '%s → %s: Rp %s',
            $source?->nama ?? 'Unknown',
            $target?->nama ?? 'Unknown',
            $amount
        );
    }
}
