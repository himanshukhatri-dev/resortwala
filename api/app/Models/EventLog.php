<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventLog extends Model
{
    protected $fillable = [
        'event_name',
        'event_category',
        'user_id',
        'role',
        'session_id',
        'entity_type',
        'entity_id',
        'screen_name',
        'action',
        'metadata',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'response_time',
        'status',
        'error_code'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
