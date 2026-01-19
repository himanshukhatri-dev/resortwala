<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel', // email, sms, whatsapp
        'recipient',
        'subject',
        'content',
        'template_name',
        'event_name',
        'status', // sent, failed, queued
        'error_message',
        'metadata',
        'created_by' // optional for manual sends
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Status Constants
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';
    const STATUS_QUEUED = 'queued';
}
