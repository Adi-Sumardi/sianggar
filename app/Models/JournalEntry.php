<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\JournalEntryStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalEntry extends Model
{
    use HasFactory, HasUlids;

    /**
     * The table associated with the model.
     */
    protected $table = 'journal_entries';

    /**
     * Hanya kolom `ulid` yang di-generate otomatis (PK numerik tetap increment).
     *
     * @return array<int, string>
     */
    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    /**
     * Identifier publik untuk URL/route adalah ulid, bukan id numerik.
     */
    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    /**
     * Route binding dual: terima ULID maupun ID numerik.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field !== null) {
            return $this->where($field, $value)->first();
        }

        if (is_numeric($value)) {
            return $this->where('id', $value)->first();
        }

        return $this->where('ulid', $value)->first();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tanggal',
        'no_bukti',
        'journal_id',
        'unit_id',
        'sumber_type',
        'sumber_id',
        'status',
        'keterangan',
        'created_by',
        'posted_by',
        'posted_at',
        'reversal_of_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'status' => JournalEntryStatus::class,
            'posted_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function sumber(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'sumber_type', 'sumber_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(JournalItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reversalOf(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'reversal_of_id');
    }

    public function reversals(): HasMany
    {
        return $this->hasMany(JournalEntry::class, 'reversal_of_id');
    }
}
