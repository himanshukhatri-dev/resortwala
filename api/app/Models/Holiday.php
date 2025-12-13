<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    protected $fillable = ['property_id', 'name', 'from_date', 'to_date', 'base_price', 'extra_person_price'];
    
    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'base_price' => 'decimal:2',
        'extra_person_price' => 'decimal:2',
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }
}
