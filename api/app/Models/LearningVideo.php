<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningVideo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'video_url',
        'thumbnail_url',
        'duration_seconds',
        'category',
        'subcategory',
        'tags',
        'display_order',
        'is_featured',
        'is_required',
        'transcript',
        'key_points',
        'related_features',
        'view_count',
        'completion_count',
        'avg_rating',
        'is_active',
    ];

    protected $casts = [
        'tags' => 'array',
        'key_points' => 'array',
        'related_features' => 'array',
        'is_featured' => 'boolean',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'avg_rating' => 'decimal:2',
    ];

    public function progress()
    {
        return $this->hasMany(VendorLearningProgress::class, 'video_id');
    }
}
