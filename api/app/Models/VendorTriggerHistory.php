<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorTriggerHistory extends Model
{
    use HasFactory;

    protected $table = 'vendor_trigger_history';

    protected $fillable = [
        'vendor_id',
        'trigger_rule_id',
        'triggered_at',
        'page_route',
        'trigger_reason',
        'vendor_action',
        'action_taken_at',
        'session_id',
    ];

    protected $casts = [
        'triggered_at' => 'datetime',
        'action_taken_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function rule()
    {
        return $this->belongsTo(SmartTriggerRule::class, 'trigger_rule_id');
    }
}
