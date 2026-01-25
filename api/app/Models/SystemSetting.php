<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'maintenance_mode',
        'coming_soon_mode',
        'maintenance_content',
        'coming_soon_content',
        'logo_url',
        'developer_bypass_key',
        'updated_by'
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'coming_soon_mode' => 'boolean',
        'maintenance_content' => 'array',
        'coming_soon_content' => 'array',
    ];

    /**
     * Get the singleton settings record
     */
    public static function current()
    {
        return static::first() ?? new static();
    }
}
