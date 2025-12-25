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
        'SpecialRequest',
        'coupon_code',
        'discount_amount',
        'tax_amount',
        'base_amount',
        'payment_method',
        'payment_status',
        'booking_reference'
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'PropertyId', 'PropertyId');
    }
}
