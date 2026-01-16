<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoiceProject extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'visual_options' => 'array',
    ];
}
