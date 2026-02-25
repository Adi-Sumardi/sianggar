<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class RevisionComment extends Model
{
    use HasFactory;

    protected $table = 'revision_comments';

    protected $fillable = [
        'commentable_type',
        'commentable_id',
        'user_id',
        'message',
        'revision_round',
        'is_initial_note',
    ];

    protected function casts(): array
    {
        return [
            'revision_round' => 'integer',
            'is_initial_note' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeForRound(Builder $query, int $round): Builder
    {
        return $query->where('revision_round', $round);
    }

    public function scopeLatestRound(Builder $query): Builder
    {
        $subQuery = self::query()
            ->whereColumn('commentable_type', $this->getTable() . '.commentable_type')
            ->whereColumn('commentable_id', $this->getTable() . '.commentable_id')
            ->selectRaw('MAX(revision_round)');

        return $query->where('revision_round', $subQuery);
    }
}
