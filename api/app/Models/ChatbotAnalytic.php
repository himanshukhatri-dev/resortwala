<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatbotAnalytic extends Model
{
    use HasFactory;

    protected $fillable = [
        'interaction_type',
        'faq_id',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'faq_id' => 'integer'
    ];

    // Optional relation
    public function faq()
    {
        return $this->belongsTo(ChatbotFaq::class, 'faq_id');
    }
}
