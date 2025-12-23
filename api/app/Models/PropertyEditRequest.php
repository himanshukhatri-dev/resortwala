<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyEditRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'vendor_id',
        'changes_json',
        'status',
        'admin_feedback'
    ];

    protected $casts = [
        'changes_json' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }
}
