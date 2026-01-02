<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyVideo extends Model
{
    protected $fillable = [
        'property_id',
        'video_path',
        'display_order'
    ];

    protected $casts = [
        'display_order' => 'integer'
    ];

    protected $appends = ['video_url'];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }

    public function getVideoUrlAttribute()
    {
        if (str_starts_with($this->video_path, 'http')) {
            return $this->video_path;
        }
        
        $path = $this->video_path;
        // If path already starts with storage/, use it as is
        if (str_starts_with($path, 'storage/')) {
            return asset('api/' . $path);
        }
        // If path starts with properties/, prepend storage/
        if (str_starts_with($path, 'properties/')) {
            return asset('api/storage/' . $path);
        }
        
        // Default fallback
        return asset('api/storage/properties/' . $path);
    }
}
