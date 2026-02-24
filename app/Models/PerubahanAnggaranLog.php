<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerubahanAnggaranLog extends Model
{
    use HasFactory;

    protected $table = 'perubahan_anggaran_logs';

    protected $fillable = [
        'perubahan_anggaran_id',
        'perubahan_anggaran_item_id',
        'source_detail_mata_anggaran_id',
        'target_detail_mata_anggaran_id',
        'source_saldo_before',
        'source_saldo_after',
        'target_saldo_before',
        'target_saldo_after',
        'amount',
        'executed_by',
        'executed_at',
    ];

    protected function casts(): array
    {
        return [
            'source_saldo_before' => 'decimal:2',
            'source_saldo_after' => 'decimal:2',
            'target_saldo_before' => 'decimal:2',
            'target_saldo_after' => 'decimal:2',
            'amount' => 'decimal:2',
            'executed_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function perubahanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PerubahanAnggaran::class);
    }

    public function perubahanAnggaranItem(): BelongsTo
    {
        return $this->belongsTo(PerubahanAnggaranItem::class);
    }

    public function sourceDetailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class, 'source_detail_mata_anggaran_id');
    }

    public function targetDetailMataAnggaran(): BelongsTo
    {
        return $this->belongsTo(DetailMataAnggaran::class, 'target_detail_mata_anggaran_id');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executed_by');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Get formatted log entry for display.
     */
    public function getLogEntry(): string
    {
        $source = $this->sourceDetailMataAnggaran;
        $target = $this->targetDetailMataAnggaran;
        $executor = $this->executor;

        return sprintf(
            'Transfer Rp %s dari "%s" ke "%s" oleh %s pada %s',
            number_format((float) $this->amount, 0, ',', '.'),
            $source?->nama ?? 'Unknown',
            $target?->nama ?? 'Unknown',
            $executor?->name ?? 'System',
            $this->executed_at?->format('d/m/Y H:i') ?? '-'
        );
    }

    /**
     * Get the balance change summary for source.
     */
    public function getSourceBalanceChange(): string
    {
        return sprintf(
            'Rp %s → Rp %s',
            number_format((float) $this->source_saldo_before, 0, ',', '.'),
            number_format((float) $this->source_saldo_after, 0, ',', '.')
        );
    }

    /**
     * Get the balance change summary for target.
     */
    public function getTargetBalanceChange(): string
    {
        return sprintf(
            'Rp %s → Rp %s',
            number_format((float) $this->target_saldo_before, 0, ',', '.'),
            number_format((float) $this->target_saldo_after, 0, ',', '.')
        );
    }
}
