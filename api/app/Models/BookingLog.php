<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingLog extends Model
{
    protected $table = 'booking_logs';

    protected $fillable = [
        'booking_id',
        'event_type',
        'from_status',
        'to_status',
        'channel',
        'subject',
        'message',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'json'
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'BookingId');
    }
}
