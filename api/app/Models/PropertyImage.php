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
        
        $path = $this->image_path;
        // If path already starts with storage/, use it as is
        if (str_starts_with($path, 'storage/')) {
            return asset($path);
        }
        // If path starts with properties/, prepend storage/
        if (str_starts_with($path, 'properties/')) {
            return asset('storage/' . $path);
        }
        
        // Default fallback
        return asset('storage/properties/' . $path);
    }
}
