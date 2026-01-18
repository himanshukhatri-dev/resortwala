<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorialStep extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'visual_metadata' => 'array',
    ];

    public function tutorial()
    {
        return $this->belongsTo(Tutorial::class);
    }
}
