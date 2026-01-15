<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrawlJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'city', 'source', 'status', 'leads_found', 'leads_added',
        'error_message', 'started_at', 'completed_at', 'triggered_by'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}
