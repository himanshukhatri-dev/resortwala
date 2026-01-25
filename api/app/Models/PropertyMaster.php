<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class PropertyMaster extends Model
{
    use Auditable;
    protected $appends = ['image_url', 'rating_display', 'display_price', 'market_price'];

    public function reviews()
    {
        return $this->hasMany(\App\Models\PropertyReview::class, 'property_id', 'PropertyId');
    }

    public function getRatingDisplayAttribute()
    {
        // Use single DB Rating as source of truth
        // Try different column name variations for compatibility
        $rating = $this->Rating ?? $this->rating ?? $this->customer_avg_rating ?? 0;
        $rating = $rating ? (float) $rating : 0;
        return [
            'total' => $rating,
            'internal' => $rating,
            'google' => 0,
            'count' => 0 // Hiding count for now as per request to remove estimated text
        ];
    }

    public function getDisplayPriceAttribute()
    {
        // 1. Determine today's price based on day of week
        $today = now();
        $dayOfWeek = $today->dayOfWeek; // 0 (Sun) - 6 (Sat)
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $todayName = $days[$dayOfWeek];
        $isWeekend = in_array($todayName, ['friday', 'saturday', 'sunday']);

        $calculatedPrice = $this->Price; // Default fallback

        // Note: We don't load relations here to avoid N+1 in appends if possible,
        // but for show() it's fine. For index(), index() already does this manually.
        // To be safe, we check if relation is loaded or use attributes.

        $adminPricing = $this->admin_pricing ?? [];

        if (strtolower($this->PropertyType) == 'waterpark') {
            $wpKey = $isWeekend ? 'adult_weekend' : 'adult_weekday';
            if (isset($adminPricing[$wpKey]['final']) && $adminPricing[$wpKey]['final'] > 0) {
                $calculatedPrice = $adminPricing[$wpKey]['final'];
            }
        } elseif (isset($adminPricing[$todayName]['villa']['final']) && $adminPricing[$todayName]['villa']['final'] > 0) {
            $calculatedPrice = $adminPricing[$todayName]['villa']['final'];
        } else {
            // Column fallbacks
            if ($dayOfWeek >= 1 && $dayOfWeek <= 4) { // Mon(1) - Thu(4)
                $calculatedPrice = $this->price_mon_thu ?? $calculatedPrice;
            } elseif ($dayOfWeek == 6) { // Sat(6)
                $calculatedPrice = $this->price_sat ?? $calculatedPrice;
            } else { // Fri(5) & Sun(0)
                $calculatedPrice = $this->price_fri_sun ?? $calculatedPrice;
            }
        }

        return $calculatedPrice;
    }

    public function getMarketPriceAttribute()
    {
        $today = now();
        $dayOfWeek = $today->dayOfWeek; // 0 (Sun) - 6 (Sat)
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $todayName = $days[$dayOfWeek];
        $isWeekend = in_array($todayName, ['friday', 'saturday', 'sunday']);

        $adminPricing = $this->admin_pricing ?? [];

        // 1. Determine Market Price (Vendor Ask)
        $marketPrice = $this->Price; // Default fallback

        if (strtolower($this->PropertyType) == 'waterpark') {
            $wpKey = $isWeekend ? 'adult_weekend' : 'adult_weekday';
            if (isset($adminPricing[$wpKey]['current']) && $adminPricing[$wpKey]['current'] > 0) {
                $marketPrice = $adminPricing[$wpKey]['current'];
            }
        } elseif (isset($adminPricing[$todayName]['villa']['current']) && $adminPricing[$todayName]['villa']['current'] > 0) {
            $marketPrice = $adminPricing[$todayName]['villa']['current'];
        }

        return $marketPrice;
    }

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
        'Name',
        'ShortName',
        'PropertyType',
        'Price',
        'DealPrice',
        'Tax',
        'Address',
        'LongDescription',
        'ShortDescription',
        'Website',
        'Email',
        'MobileNo',
        'IsActive',
        'GSTNo',
        'ContactPerson',
        'CityName',
        'GoogleMapLink',
        'IsActive',
        'GSTNo',
        'ContactPerson',
        'CityName',
        'GoogleMapLink',
        'CityLatitude',
        'CityLongitude',
        'Location',
        'PaymentFacitlity',
        'Latitude',
        'Longitude', // Added for geospatial search
        'AvailabilityType',
        'NoofBathRooms',
        'NoofQueenBeds',
        'Occupancy',
        'BookingSpecailMessage',
        'PropertyOffersDetails',
        'PropertyRules',
        'IsDeleted',
        'PerCost',
        'ResortWalaRate',
        'PropertyStatus',
        'IsVendorPropAvailable',
        'IsPropertyUpdate',
        'NoofRooms',
        'MaxCapacity',
        'CheckinDate',
        'CheckoutDate',
        'Breakfast',
        'Lunch',
        'Dinner',
        'HiTea',
        'checkInTime',
        'checkOutTime',
        'vendor_id',
        'is_approved',
        'share_token',
        'price_mon_thu',
        'price_fri_sun',
        'price_sat',
        'onboarding_data',
        'video_url',
        'admin_pricing',
        'Rating',
        'is_developer_only'
    ];

    protected $casts = [
        'onboarding_data' => 'array',
        'admin_pricing' => 'array',
        'IsActive' => 'boolean',
        'PropertyStatus' => 'boolean',
        'is_developer_only' => 'boolean'
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

    public function isWaterpark()
    {
        $type = strtolower($this->PropertyType ?? '');
        return str_contains($type, 'water') || str_contains(strtolower($this->Name), 'water') || str_contains($type, 'resort');
    }
}
