<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorLearningProgress extends Model
{
    use HasFactory;

    protected $table = 'vendor_learning_progress';

    protected $fillable = [
        'vendor_id',
        'video_id',
        'status',
        'watch_duration_seconds',
        'completion_percentage',
        'is_helpful',
        'rating',
        'feedback',
        'first_viewed_at',
        'last_viewed_at',
        'completed_at',
    ];

    protected $casts = [
        'is_helpful' => 'boolean',
        'first_viewed_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function video()
    {
        return $this->belongsTo(LearningVideo::class, 'video_id');
    }
}
