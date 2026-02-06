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
        'module_id', // Changed from video_id
        'status',
        'current_step',
        'completed_at',
        // Keeping legacy columns if needed for migration compatibility, otherwise assume migration cleaned them
        // 'video_id', 'watch_duration_seconds', 'completion_percentage', 'is_helpful', 'rating', 'feedback', 'first_viewed_at', 'last_viewed_at'
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(LearningModule::class, 'module_id');
    }

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

}
