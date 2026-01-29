<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Blog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'cover_image',
        'author',
        'category',
        'published_at',
        'tags',
        'meta_title',
        'meta_description',
        'location_id',
        'property_id',
        'is_published',
        'views_count',
        'reading_time'
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime',
        'is_published' => 'boolean'
    ];

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Relationships
    public function location()
    {
        // return $this->belongsTo(Location::class);
    }

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }

    // Attributes
    public function getReadingTimeAttribute()
    {
        if ($this->attributes['reading_time'] ?? null) {
            return $this->attributes['reading_time'];
        }

        // Calculate reading time (average 200 words per minute)
        $wordCount = str_word_count(strip_tags($this->content ?? ''));
        $minutes = ceil($wordCount / 200);
        return $minutes . ' min read';
    }

    public function getCoverImageAttribute($value)
    {
        if (!$value)
            return null;

        // If it's already a full URL, return it
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // Get configured asset URL (Reliable)
        $baseUrl = config('app.asset_url', config('app.url'));
        $baseUrl = rtrim($baseUrl, '/');

        // Path normalization (Mirroring PropertyMaster logic)
        $path = $value;
        if (str_starts_with($path, 'storage/')) {
            return $baseUrl . '/' . $path;
        }
        if (str_starts_with($path, 'properties/')) {
            return $baseUrl . '/storage/' . $path;
        }

        return $baseUrl . '/storage/properties/' . $path;
    }

    // Increment views
    public function incrementViews()
    {
        $this->increment('views_count');
    }
}
