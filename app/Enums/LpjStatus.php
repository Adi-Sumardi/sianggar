<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Status for LPJ (Laporan Pertanggungjawaban).
 *
 * Flow:
 * Draft → Submitted → Validated (by Staf Keuangan) → ApprovedByMiddle → Approved (final)
 *
 * Alternative flows:
 * - Any stage can go to Revised (sent back for revision)
 * - Any stage can go to Rejected (workflow ends)
 */
enum LpjStatus: string
{
    case Draft = 'draft';                       // LPJ created but not submitted
    case Submitted = 'submitted';               // Submitted to Staf Keuangan
    case Validated = 'validated';               // Staf Keuangan validated, waiting middle approver
    case ApprovedByMiddle = 'approved-middle';  // Middle approver approved, waiting Keuangan
    case Approved = 'approved';                 // Keuangan approved - FINAL
    case Revised = 'revised';                   // Revision requested, waiting resubmit
    case Rejected = 'rejected';                 // Rejected - workflow stopped

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Submitted => 'Diajukan',
            self::Validated => 'Divalidasi',
            self::ApprovedByMiddle => 'Disetujui Bidang',
            self::Approved => 'Disetujui',
            self::Revised => 'Perlu Revisi',
            self::Rejected => 'Ditolak',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Submitted => 'primary',
            self::Validated => 'info',
            self::ApprovedByMiddle => 'info',
            self::Approved => 'success',
            self::Revised => 'warning',
            self::Rejected => 'danger',
        };
    }

    /**
     * Check if this status allows editing.
     */
    public function isEditable(): bool
    {
        return in_array($this, [self::Draft, self::Revised], true);
    }

    /**
     * Check if this status is a final state.
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::Approved, self::Rejected], true);
    }

    /**
     * Check if this status is in the approval workflow.
     */
    public function isInWorkflow(): bool
    {
        return in_array($this, [
            self::Submitted,
            self::Validated,
            self::ApprovedByMiddle,
        ], true);
    }
}
