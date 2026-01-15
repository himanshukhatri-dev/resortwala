<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'type', // text, json, boolean
    ];

    protected $casts = [
        'value' => 'string', // Handle manual casting in controller for JSON/Boolean
    ];
}
