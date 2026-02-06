<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'description',
        'video_url',
        'thumbnail_url',
        'category',
        'difficulty',
        'duration_seconds',
        'is_active',
        'meta_tags'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'meta_tags' => 'array'
    ];

    /**
     * The steps for this module.
     */
    public function steps()
    {
        return $this->hasMany(LearningStep::class, 'module_id')->orderBy('step_order');
    }

    /**
     * User progress for this module.
     */
    public function progress()
    {
        return $this->hasOne(VendorLearningProgress::class, 'module_id');
    }
}
