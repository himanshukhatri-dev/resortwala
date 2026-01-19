<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTrigger extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_name',
        'email_template_id',
        'sms_template_id',
        'whatsapp_template_id',
        'audience', // customer, vendor, admin
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function emailTemplate()
    {
        return $this->belongsTo(NotificationTemplate::class, 'email_template_id');
    }

    public function smsTemplate()
    {
        return $this->belongsTo(NotificationTemplate::class, 'sms_template_id');
    }

    public function whatsappTemplate()
    {
        return $this->belongsTo(NotificationTemplate::class, 'whatsapp_template_id');
    }
}
