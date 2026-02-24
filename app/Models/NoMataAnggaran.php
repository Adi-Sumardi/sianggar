<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NoMataAnggaran extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'no_mata_anggarans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode',
        'nama',
        'keterangan',
    ];
}
