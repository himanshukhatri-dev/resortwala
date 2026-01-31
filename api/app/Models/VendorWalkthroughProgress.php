<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorWalkthroughProgress extends Model
{
    use HasFactory;

    protected $table = 'vendor_walkthrough_progress';

    protected $fillable = [
        'vendor_id',
        'walkthrough_id',
        'page_route',
        'status',
        'current_step',
        'total_steps',
        'started_at',
        'completed_at',
        'last_interaction_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_interaction_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function walkthrough()
    {
        return $this->belongsTo(PageWalkthrough::class, 'walkthrough_id');
    }
}
