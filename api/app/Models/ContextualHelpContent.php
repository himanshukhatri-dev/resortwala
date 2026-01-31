<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContextualHelpContent extends Model
{
    use HasFactory;

    protected $table = 'contextual_help_content';

    protected $fillable = [
        'element_id',
        'page_route',
        'title',
        'content',
        'help_type',
        'position',
        'trigger',
        'icon_type',
        'related_video_id',
        'related_walkthrough_id',
        'external_link',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function relatedVideo()
    {
        return $this->belongsTo(LearningVideo::class, 'related_video_id');
    }

    public function relatedWalkthrough()
    {
        return $this->belongsTo(PageWalkthrough::class, 'related_walkthrough_id');
    }
}
