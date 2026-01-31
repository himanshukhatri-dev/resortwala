<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIChatConversation extends Model
{
    use HasFactory;

    protected $table = 'ai_chat_conversations';

    protected $fillable = [
        'vendor_id',
        'session_id',
        'messages',
        'current_page',
        'vendor_context',
        'status',
        'resolution_type',
        'was_helpful',
        'rating',
        'feedback',
        'started_at',
        'last_message_at',
        'resolved_at',
    ];

    protected $casts = [
        'messages' => 'array',
        'vendor_context' => 'array',
        'was_helpful' => 'boolean',
        'started_at' => 'datetime',
        'last_message_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }
}
