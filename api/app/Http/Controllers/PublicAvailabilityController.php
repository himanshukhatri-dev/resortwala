<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;

class PublicAvailabilityController extends Controller
{
    // Public view of calendar (via share token)
    public function show($uuid)
    {
        $property = PropertyMaster::where('share_token', $uuid)->firstOrFail();

        // Only return necessary info (privacy)
        $bookings = Booking::where('PropertyId', $property->PropertyId)
            ->whereIn('Status', ['confirmed', 'locked', 'pending'])
            ->get(['CheckInDate', 'CheckOutDate', 'Status']);

        return response()->json([
            'property' => [
                'id' => $property->PropertyId,
                'name' => $property->Name,
                'location' => $property->Location,
                'price' => $property->Price
            ],
            'bookings' => $bookings
        ]);
    }

    // Agent/Guest requests a booking
    public function request(Request $request)
    {
        $request->validate([
            'property_id' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'name' => 'required|string',
            'mobile' => 'required|string'
        ]);

        // Check conflicts
        $exists = Booking::where('PropertyId', $request->property_id)
            ->where('Status', '!=', 'cancelled')
            ->where(function($q) use ($request) {
                 $q->whereBetween('CheckInDate', [$request->start_date, $request->end_date])
                   ->orWhereBetween('CheckOutDate', [$request->start_date, $request->end_date]);
            })->exists();

        if ($exists) {
            return response()->json(['message' => 'Dates unavailable'], 422);
        }

        $booking = new Booking();
        $booking->PropertyId = $request->property_id;
        $booking->CustomerName = $request->name;
        $booking->CustomerMobile = $request->mobile;
        $booking->CheckInDate = $request->start_date;
        $booking->CheckOutDate = $request->end_date;
        $booking->Guests = 2; // Default
        $booking->Status = 'pending';
        $booking->save();

        return response()->json(['message' => 'Request sent to owner', 'booking' => $booking]);
    }
}
