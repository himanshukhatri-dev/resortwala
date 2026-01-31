<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmartTriggerRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'trigger_type',
        'page_route',
        'conditions',
        'action_type',
        'action_config',
        'max_triggers_per_vendor',
        'cooldown_hours',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'conditions' => 'array',
        'action_config' => 'array',
        'is_active' => 'boolean',
    ];

    public function history()
    {
        return $this->hasMany(VendorTriggerHistory::class, 'trigger_rule_id');
    }
}
