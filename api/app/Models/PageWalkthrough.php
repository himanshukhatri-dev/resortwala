<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageWalkthrough extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_route',
        'title',
        'page_name',
        'description',
        'steps',
        'trigger_on_first_visit',
        'trigger_on_feature_flag',
        'trigger_condition',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'steps' => 'array',
        'trigger_condition' => 'array',
        'trigger_on_first_visit' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function progress()
    {
        return $this->hasMany(VendorWalkthroughProgress::class, 'walkthrough_id');
    }
}
