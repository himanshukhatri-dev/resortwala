<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyImage extends Model
{
    protected $fillable = [
        'property_id',
        'image_path',
        'is_primary',
        'display_order'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'display_order' => 'integer'
    ];

    protected $appends = ['image_url'];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }

    public function getImageUrlAttribute()
    {
        if (str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }

        // Reliable Base URL
        $baseUrl = config('app.asset_url', config('app.url'));
        $baseUrl = rtrim($baseUrl, '/');

        $path = $this->image_path;

        // Normalize Path
        if (str_starts_with($path, 'storage/')) {
            return $baseUrl . '/' . $path;
        }
        if (str_starts_with($path, 'properties/')) {
            return $baseUrl . '/storage/' . $path;
        }

        // Default fallback
        return $baseUrl . '/storage/properties/' . $path;
    }
}
