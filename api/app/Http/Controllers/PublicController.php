<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyMaster;
use App\Models\Booking;
use App\Models\Vendor;
use Carbon\Carbon;

class PublicController extends Controller
{
    /**
     * Get public availability for a specific property.
     */
    public function getPropertyCalendar($id)
    {
        try {
            $property = PropertyMaster::with(['images'])
                        ->where(function($q) use ($id) {
                            $q->where('share_token', $id);
                            if (is_numeric($id)) {
                                $q->orWhere('PropertyId', $id);
                            }
                        })
                        ->first();
            
            if (!$property) {
                return response()->json(['message' => 'Property not found'], 404);
            }

            // Fetch bookings
            $bookings = Booking::where('PropertyId', $property->PropertyId)
                ->where('CheckOutDate', '>=', Carbon::today())
                ->whereIn('Status', ['Confirmed', 'confirmed', 'pending', 'CheckedIn', 'checked_in', 'CheckedOut', 'checked_out', 'Blocked', 'blocked'])
                ->get(['CheckInDate', 'CheckOutDate', 'Status', 'booking_source']);

            // Fetch holidays (only approved)
            $holidays = \App\Models\Holiday::where('property_id', $property->PropertyId)
                ->where('to_date', '>=', Carbon::today())
                ->where(function ($query) {
                    $query->where('approved', 1)
                          ->orWhereNull('approved'); // Fallback for existing
                })
                ->get();

            // Format events
            $events = [];
            
            if (($property->property_type ?? 'villa') !== 'waterpark') {
                foreach ($bookings as $booking) {
                    $events[] = [
                        'start' => $booking->CheckInDate,
                        'end' => $booking->CheckOutDate,
                        'title' => 'Booked',
                        'status' => 'booked',
                        'allDay' => true,
                    ];
                }
            }

            return response()->json([
                'property' => [
                    'id' => $property->PropertyId,
                    'name' => $property->Name,
                    'location' => $property->Location,
                    'city' => $property->CityName,
                    'price_mon_thu' => $property->price_mon_thu ?? $property->Price,
                    'price_fri_sun' => $property->price_fri_sun ?? $property->price_sat ?? $property->DealPrice,
                    'images' => $property->images,
                    'vendor_id' => $property->vendor_id,
                    'vendor_phone' => $property->MobileNo,
                    'video_url' => $property->video_url,
                    'onboarding_data' => $property->onboarding_data,
                    'property_type' => $property->property_type ?? 'villa',
                    'google_map_link' => $property->GoogleMapLink,
                    'latitude' => $property->CityLatitude,
                    'longitude' => $property->CityLongitude
                ],
                'events' => $events,
                'bookings' => $bookings,
                'holidays' => $holidays,
                'allows_multiple_bookings' => ($property->property_type ?? 'villa') === 'waterpark'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server Error',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    /**
     * Get public availability for ALL properties of a vendor (Master View).
     */
    public function getVendorMasterCalendar($vendorId)
    {
        // Verify vendor exists (User table)
        // Assuming vendor_id in PropertyMaster refers to a User
        // $vendor = Vendor::findOrFail($vendorId); // Vendor model doesn't exist, using User
        $vendor = \App\Models\User::findOrFail($vendorId);

        // Get all properties
        $properties = PropertyMaster::where('vendor_id', $vendorId)->get(['PropertyId', 'Name', 'Location']);

        $propertyIds = $properties->pluck('PropertyId');

        // Get bookings
        $bookings = Booking::whereIn('PropertyId', $propertyIds)
            ->where('CheckOutDate', '>=', Carbon::today())
            ->whereIn('Status', ['Confirmed', 'confirmed', 'CheckedIn', 'checked_in', 'CheckedOut', 'checked_out', 'Blocked', 'blocked'])
            ->get(['PropertyId', 'CheckInDate', 'CheckOutDate', 'Status']);

        // Format
        $events = [];
        foreach ($bookings as $booking) {
            $events[] = [
                'resourceId' => $booking->PropertyId,
                'title' => 'Booked',
                'start' => $booking->CheckInDate,
                'end' => $booking->CheckOutDate,
                'status' => 'booked',
                'allDay' => true,
            ];
        }

        return response()->json([
            'vendor' => [
                'id' => $vendor->id,
                'name' => $vendor->name,
            ],
            'properties' => $properties,
            'events' => $events
        ]);
    }
}
