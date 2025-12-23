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
     * Returns minimal data: Property Name, Location, Images (cover), and Booked Dates.
     */
    public function getPropertyCalendar($id)
    {
        $property = PropertyMaster::with(['images'])->findOrFail($id);

        // Fetch bookings for the next 12 months
        // Using PascalCase column names as per Booking model
        $bookings = Booking::where('PropertyId', $id)
            ->where('CheckOutDate', '>=', Carbon::today())
            ->whereIn('Status', ['Confirmed', 'confirmed', 'pending', 'CheckedIn', 'checked_in', 'CheckedOut', 'checked_out', 'Blocked', 'blocked'])
            ->get(['CheckInDate', 'CheckOutDate', 'Status']);

        // Format events for calendar
        $events = [];
        
        // For villas, show all bookings to block dates
        // For waterparks, don't show bookings (allow multiple)
        if ($property->property_type !== 'waterpark') {
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
                'vendor_phone' => $property->MobileNo, // Exposing Property Contact Number
                'video_url' => $property->video_url,
                'onboarding_data' => $property->onboarding_data,
                'property_type' => $property->property_type ?? 'villa'
            ],
            'events' => $events,
            'allows_multiple_bookings' => $property->property_type === 'waterpark'
        ]);
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
