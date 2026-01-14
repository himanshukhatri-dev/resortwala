<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class PropertyAddon extends Model
{
    protected $table = 'property_addons';
    
    protected $fillable = [
        'property_id',
        'name',
        'cost_price',
        'selling_price',
        'description',
        'is_active'
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    public function property()
    {
        return $this->belongsTo(\App\Models\PropertyMaster::class, 'property_id', 'PropertyId');
    }
}
