<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ReferenceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * LPJ Validation record created by Staf Keuangan.
 *
 * Contains the checklist validation and determines the routing
 * (which middle approver should handle the LPJ based on reference_type).
 */
class LpjValidation extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'lpj_validations';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'lpj_id',
        'validated_by',
        'has_activity_identity',
        'has_cover_letter',
        'has_narrative_report',
        'has_financial_report',
        'has_receipts',
        'reference_type',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'has_activity_identity' => 'boolean',
            'has_cover_letter' => 'boolean',
            'has_narrative_report' => 'boolean',
            'has_financial_report' => 'boolean',
            'has_receipts' => 'boolean',
            'reference_type' => ReferenceType::class,
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Get the LPJ that this validation belongs to.
     */
    public function lpj(): BelongsTo
    {
        return $this->belongsTo(Lpj::class);
    }

    /**
     * Get the user who performed the validation.
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    /**
     * Check if all checklist items are checked.
     */
    public function isComplete(): bool
    {
        return $this->has_activity_identity
            && $this->has_cover_letter
            && $this->has_narrative_report
            && $this->has_financial_report
            && $this->has_receipts;
    }

    /**
     * Get the count of checked items.
     */
    public function getCheckedCount(): int
    {
        return collect([
            $this->has_activity_identity,
            $this->has_cover_letter,
            $this->has_narrative_report,
            $this->has_financial_report,
            $this->has_receipts,
        ])->filter()->count();
    }

    /**
     * Get the total number of checklist items.
     */
    public static function getTotalItems(): int
    {
        return 5;
    }
}
