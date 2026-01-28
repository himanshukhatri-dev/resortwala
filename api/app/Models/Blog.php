<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Blog extends Model
{
    use HasFactory;

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
        'property_id'
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime'
    ];

    public function location()
    {
        // return $this->belongsTo(Location::class);
    }

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
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
}
