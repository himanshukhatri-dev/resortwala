<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyReview extends Model
{
    protected $fillable = [
        'property_id',
        'user_name',
        'rating',
        'comment',
        'verified'
    ];

    protected $casts = [
        'rating' => 'float',
        'verified' => 'boolean'
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }
}
