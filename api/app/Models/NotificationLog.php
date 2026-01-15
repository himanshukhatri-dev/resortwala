<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'body',
        'audience_type',
        'audience_data',
        'sent_count',
        'success_count',
        'failure_count',
        'created_by'
    ];

    protected $casts = [
        'audience_data' => 'array',
    ];
}
