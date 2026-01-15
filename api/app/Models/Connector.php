<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Connector extends Model
{
    protected $fillable = ['name', 'phone', 'email', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function properties()
    {
        return $this->belongsToMany(PropertyMaster::class, 'property_connectors', 'connector_id', 'property_id')
                    ->withPivot(['commission_type', 'commission_value', 'effective_from', 'effective_to'])
                    ->withTimestamps();
    }

    public function earnings()
    {
        return $this->hasMany(ConnectorEarning::class);
    }
}
