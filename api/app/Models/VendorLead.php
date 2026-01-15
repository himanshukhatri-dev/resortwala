<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorLead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'source', 'source_id', 'contact_person', 'phone', 'email', 'website',
        'google_maps_link', 'latitude', 'longitude', 'city', 'address',
        'rating', 'review_count', 'category', 'raw_data',
        'status', 'notes', 'confidence_score', 'is_opt_out'
    ];

    protected $casts = [
        'raw_data' => 'array',
        'rating' => 'float',
        'is_opt_out' => 'boolean',
    ];
}
