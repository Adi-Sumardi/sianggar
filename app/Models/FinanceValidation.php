<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AmountCategory;
use App\Enums\ReferenceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceValidation extends Model
{
    protected $fillable = [
        'pengajuan_anggaran_id',
        'validated_by',
        'valid_document',
        'valid_calculation',
        'valid_budget_code',
        'reasonable_cost',
        'reasonable_volume',
        'reasonable_executor',
        'reference_type',
        'amount_category',
        'need_lpj',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'valid_document' => 'boolean',
            'valid_calculation' => 'boolean',
            'valid_budget_code' => 'boolean',
            'reasonable_cost' => 'boolean',
            'reasonable_volume' => 'boolean',
            'reasonable_executor' => 'boolean',
            'need_lpj' => 'boolean',
            'reference_type' => ReferenceType::class,
            'amount_category' => AmountCategory::class,
        ];
    }

    public function pengajuanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PengajuanAnggaran::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
