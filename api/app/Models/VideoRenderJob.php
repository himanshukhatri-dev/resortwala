<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoRenderJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'template_id',
        'status',
        'options',
        'output_path',
        'error_message'
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }
}
