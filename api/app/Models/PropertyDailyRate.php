<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyDailyRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'day_of_week',
        'base_price',
        'extra_person_price',
        'child_price',
        'effective_from',
        'effective_to'
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
        'base_price' => 'decimal:2',
        'extra_person_price' => 'decimal:2',
        'child_price' => 'decimal:2',
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }
}
