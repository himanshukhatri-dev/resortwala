<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorOnboardingMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'profile_completed',
        'profile_completed_at',
        'property_added',
        'property_added_at',
        'pricing_set',
        'pricing_set_at',
        'availability_updated',
        'availability_updated_at',
        'photos_uploaded',
        'photos_uploaded_at',
        'property_published',
        'property_published_at',
        'first_booking_received',
        'first_booking_received_at',
        'payout_setup',
        'payout_setup_at',
        'completion_percentage',
        'onboarding_completed',
        'onboarding_completed_at',
    ];

    protected $casts = [
        'profile_completed' => 'boolean',
        'property_added' => 'boolean',
        'pricing_set' => 'boolean',
        'availability_updated' => 'boolean',
        'photos_uploaded' => 'boolean',
        'property_published' => 'boolean',
        'first_booking_received' => 'boolean',
        'payout_setup' => 'boolean',
        'onboarding_completed' => 'boolean',
        'profile_completed_at' => 'datetime',
        'property_added_at' => 'datetime',
        'pricing_set_at' => 'datetime',
        'availability_updated_at' => 'datetime',
        'photos_uploaded_at' => 'datetime',
        'property_published_at' => 'datetime',
        'first_booking_received_at' => 'datetime',
        'payout_setup_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }
}
