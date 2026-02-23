<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;
use App\Enums\BookingStatus;

class Booking extends Model
{
    use Auditable;
    protected $table = 'bookings';
    protected $primaryKey = 'BookingId';

    // Helper methods for status checks
    public function isInitiated()
    {
        return $this->Status === BookingStatus::INITIATED;
    }
    public function isBooked()
    {
        return $this->Status === BookingStatus::BOOKED;
    }
    public function isConfirmed()
    {
        return $this->Status === BookingStatus::CONFIRMED;
    }
    public function isRejected()
    {
        return $this->Status === BookingStatus::REJECTED;
    }
    public function isCancelled()
    {
        return $this->Status === BookingStatus::CANCELLED;
    }

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

    public function logs()
    {
        return $this->hasMany(BookingLog::class, 'booking_id', 'BookingId')->orderBy('created_at', 'desc');
    }
}
