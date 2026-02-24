<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RapbsApprovalStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RapbsApproval extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'rapbs_approvals';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'rapbs_id',
        'user_id',
        'stage',
        'stage_order',
        'status',
        'notes',
        'acted_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stage' => RapbsApprovalStage::class,
            'acted_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function rapbs(): BelongsTo
    {
        return $this->belongsTo(Rapbs::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if this approval is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if this approval is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if this approval is revised.
     */
    public function isRevised(): bool
    {
        return $this->status === 'revised';
    }

    /**
     * Check if this approval is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
