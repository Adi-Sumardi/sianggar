<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmountEditLog extends Model
{
    protected $fillable = [
        'pengajuan_anggaran_id',
        'edited_by',
        'original_amount',
        'new_amount',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'new_amount' => 'decimal:2',
        ];
    }

    public function pengajuanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PengajuanAnggaran::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edited_by');
    }
}
