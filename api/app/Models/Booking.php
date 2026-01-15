<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Booking extends Model
{
    use Auditable;
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
        'paid_amount',
        'Status',
        'SpecialRequest',
        'coupon_code',
        'discount_amount',
        'tax_amount',
        'base_amount',
        'payment_method',
        'payment_status',
        'booking_reference',
        'booking_source'
    ];

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'PropertyId', 'PropertyId');
    }
}
