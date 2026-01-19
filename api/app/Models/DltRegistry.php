<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DltRegistry extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_id',
        'sender_id',
        'template_id', // The DLT Template ID (e.g., 1007...)
        'approved_content',
        'variable_mapping',
        'is_active'
    ];

    protected $casts = [
        'variable_mapping' => 'array',
        'is_active' => 'boolean',
    ];
}
