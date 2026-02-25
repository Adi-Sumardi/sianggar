<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AmountCategory;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class PengajuanAnggaran extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_anggarans';

    protected $fillable = [
        'user_id',
        'unit_id',
        'tahun',
        'nomor_pengajuan',
        'perihal',
        'nama_pengajuan',
        'no_surat',
        'tempat',
        'waktu_kegiatan',
        'unit',
        'jumlah_pengajuan_total',
        'status_proses',
        'current_approval_stage',
        'revision_requested_stage',
        'status_revisi',
        'date_revisi',
        'time_revisi',
        'status_payment',
        'no_voucher',
        'print_status',
        'payment_recipient',
        'payment_method',
        'payment_notes',
        'paid_at',
        'paid_by',
        'amount_category',
        'reference_type',
        'need_lpj',
        'approved_amount',
        'submitter_type',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_pengajuan_total' => 'decimal:2',
            'approved_amount' => 'decimal:2',
            'need_lpj' => 'boolean',
            'status_proses' => ProposalStatus::class,
            'amount_category' => AmountCategory::class,
            'reference_type' => ReferenceType::class,
            'date_revisi' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function unitRelation(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function detailPengajuans(): HasMany
    {
        return $this->hasMany(DetailPengajuan::class);
    }

    public function approvals(): MorphMany
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function lpj(): HasOne
    {
        return $this->hasOne(Lpj::class);
    }

    public function financeValidation(): HasOne
    {
        return $this->hasOne(FinanceValidation::class);
    }

    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class);
    }

    public function activeDiscussion(): HasOne
    {
        return $this->hasOne(Discussion::class)->where('status', 'open');
    }

    public function amountEditLogs(): HasMany
    {
        return $this->hasMany(AmountEditLog::class);
    }

    public function revisionComments(): MorphMany
    {
        return $this->morphMany(RevisionComment::class, 'commentable');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByStatus(Builder $query, ProposalStatus $status): Builder
    {
        return $query->where('status_proses', $status->value);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status_proses', ProposalStatus::Draft->value);
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('status_proses', ProposalStatus::Submitted->value);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function computeAmountCategory(): AmountCategory
    {
        return AmountCategory::fromAmount((float) $this->jumlah_pengajuan_total);
    }
}
