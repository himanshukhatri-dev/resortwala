<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyMaster extends Model
{
    protected $table = 'property_masters';
    protected $primaryKey = 'PropertyId';
    
    protected $fillable = [
        'Name', 'ShortName', 'PropertyType', 'Price', 'DealPrice', 'Tax',
        'Address', 'LongDescription', 'ShortDescription', 'Website', 'Email', 'MobileNo',
        'IsActive', 'GSTNo', 'ContactPerson', 'CityName', 'GoogleMapLink',
        'CityLatitude', 'CityLongitude', 'Location', 'PaymentFacitlity',
        'AvailabilityType', 'NoofBathRooms', 'NoofQueenBeds', 'Occupancy',
        'BookingSpecailMessage', 'PropertyOffersDetails', 'PropertyRules',
        'IsDeleted', 'PerCost', 'ResortWalaRate', 'PropertyStatus',
        'IsVendorPropAvailable', 'IsPropertyUpdate', 'NoofRooms',
        'CheckinDate', 'CheckoutDate', 'Breakfast', 'Lunch', 'Dinner', 'HiTea',
        'checkInTime', 'checkOutTime', 'vendor_id', 'is_approved', 'share_token',
        'price_mon_thu', 'price_fri_sun', 'price_sat',
        'onboarding_data', 'video_url', 'admin_pricing'
    ];

    protected $casts = [
        'onboarding_data' => 'array',
        'admin_pricing' => 'array',
        'IsActive' => 'boolean',
        'PropertyStatus' => 'boolean'
    ];

    public function vendor()
    {
        return $this->belongsTo(\App\Models\User::class, 'vendor_id');
    }

    public function images()
    {
        return $this->hasMany(\App\Models\PropertyImage::class, 'property_id', 'PropertyId');
    }

    public function primaryImage()
    {
        return $this->hasOne(\App\Models\PropertyImage::class, 'property_id', 'PropertyId')
                    ->where('is_primary', true);
    }

    public function bookings()
    {
        return $this->hasMany(\App\Models\Booking::class, 'PropertyId', 'PropertyId');
    }

    // Since we have both legacy timestamps (CreatedOn) and Laravel timestamps (created_at),
    // we can keep default timestamps enabled for future updates.
}
