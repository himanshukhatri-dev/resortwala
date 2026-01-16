<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatbotFaq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'action_type',
        'action_payload',
        'priority',
        'is_active',
        'category',
        'keywords',
        'content_registry_id',
        'visible_to_vendors'
    ];

    protected $casts = [
        'action_payload' => 'array',
        'is_active' => 'boolean',
        'visible_to_vendors' => 'boolean',
        'priority' => 'integer'
    ];

    public function contentRegistry()
    {
        return $this->belongsTo(ContentRegistry::class, 'content_registry_id');
    }
}
