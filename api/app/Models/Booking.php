<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'bookings';
    protected $primaryKey = 'BookingId';
    
    protected $fillable = [
        'PropertyId',
        'CustomerName',
        'CustomerMobile',
        'CustomerEmail',
        'CheckInDate',
        'CheckOutDate',
        'Guests',
        'TotalAmount',
        'Status',
        'SpecialRequest'
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'PropertyId', 'PropertyId');
    }
}
