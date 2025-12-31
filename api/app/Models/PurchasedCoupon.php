<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchasedCoupon extends Model
{
    use HasFactory;

    protected $table = 'purchased_coupons';

    protected $fillable = [
        'booking_id',
        'user_id',
        'vendor_id',
        'property_id',
        'code',
        'status',
        'total_price',
        'valid_from',
        'valid_until',
        'redeemed_at'
    ];

    protected $casts = [
        'valid_from' => 'date',
        'valid_until' => 'date',
        'redeemed_at' => 'datetime',
        'total_price' => 'decimal:2'
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function property()
    {
        return $this->belongsTo(PropertyMaster::class, 'property_id', 'PropertyId');
    }

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    // Helper to generate unique code
    public static function generateCode()
    {
        return 'RW-' . strtoupper(\Illuminate\Support\Str::random(6));
    }
}
