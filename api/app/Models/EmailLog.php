<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel',
        'recipient',
        'subject',
        'template_name',
        'status',
        'error_message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
