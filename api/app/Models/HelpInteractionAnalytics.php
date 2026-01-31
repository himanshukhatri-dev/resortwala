<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HelpInteractionAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'interaction_type',
        'resource_type',
        'resource_id',
        'page_route',
        'trigger_source',
        'was_helpful',
        'led_to_action',
        'action_completed',
        'session_id',
        'user_agent',
    ];

    protected $casts = [
        'was_helpful' => 'boolean',
        'led_to_action' => 'boolean',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }
}
