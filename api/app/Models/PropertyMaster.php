<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class PropertyMaster extends Model
{
    use Auditable;
    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        // Check if there is a DB column 'ImageUrl' or similar
        // If not, maybe return primary image?
        $path = $this->attributes['ImageUrl'] ?? null;
        if (!$path) {
            $primary = $this->primaryImage;
            return $primary ? $primary->image_url : null;
        }
        
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        // Apply same logic as PropertyImage
        if (str_starts_with($path, 'storage/')) {
            return asset($path);
        }
        if (str_starts_with($path, 'properties/')) {
            return asset('storage/' . $path);
        }

        return asset('storage/properties/' . $path);
    }
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
        'IsVendorPropAvailable', 'IsPropertyUpdate', 'NoofRooms', 'MaxCapacity',
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

    public function addons()
    {
        return $this->hasMany(\App\Models\Admin\PropertyAddon::class, 'property_id', 'PropertyId');
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

    public function videos()
    {
        return $this->hasMany(\App\Models\PropertyVideo::class, 'property_id', 'PropertyId');
    }

    public function holidays()
    {
        return $this->hasMany(\App\Models\Holiday::class, 'property_id', 'PropertyId');
    }
    
    // NEW: Connectors Relationship
    public function connectors()
    {
        return $this->belongsToMany(\App\Models\Connector::class, 'property_connectors', 'property_id', 'connector_id')
                    ->withPivot(['commission_type', 'commission_value', 'effective_from', 'effective_to'])
                    ->withTimestamps();
    }

    public function dailyRates()
    {
        return $this->hasMany(\App\Models\PropertyDailyRate::class, 'property_id', 'PropertyId');
    }
    
    public function activeConnector()
    {
        // Helper to get the currently effective connector
        // For simplicity, getting the first active one. 
        // In real world, might need date range check vs today.
        return $this->connectors()
                    ->wherePivot('effective_from', '<=', now())
                    ->where(function ($query) {
                        $query->whereNull('property_connectors.effective_to')
                              ->orWhere('property_connectors.effective_to', '>=', now());
                    });
    }
}
