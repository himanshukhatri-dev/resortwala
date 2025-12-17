<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VendorCalendarController extends Controller
{
    // Get calendar data for a specific property
    public function index($propertyId)
    {
        $property = PropertyMaster::where('PropertyId', $propertyId)->firstOrFail();
        
        // Ensure generate uuid if missing (lazy migration)
        if (!$property->share_token) {
            $property->share_token = (string) Str::uuid();
            $property->save();
        }

        $bookings = Booking::where('PropertyId', $propertyId)
            ->whereIn('Status', ['confirmed', 'locked', 'pending'])
            ->get(['BookingId', 'CheckInDate', 'CheckOutDate', 'Status', 'CustomerName', 'CustomerMobile', 'Guests', 'TotalAmount']);

        // Use FRONTEND_URL env var or default to local React dev server
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        return response()->json([
            'property' => [
                'name' => $property->Name,
                'share_link' => "{$frontendUrl}/stay/{$property->share_token}"
            ],
            'bookings' => $bookings
        ]);
    }

    // Owner manually locks dates
    public function lock(Request $request)
    {
        $request->validate([
            'property_id' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        // Check conflicts
        $exists = Booking::where('PropertyId', $request->property_id)
            ->where('Status', '!=', 'cancelled')
            ->where(function($q) use ($request) {
                $q->whereBetween('CheckInDate', [$request->start_date, $request->end_date])
                  ->orWhereBetween('CheckOutDate', [$request->start_date, $request->end_date]);
            })->exists();

        if ($exists) {
            return response()->json(['message' => 'Dates already booked/locked'], 422);
        }

        $booking = new Booking();
        $booking->PropertyId = $request->property_id;
        $booking->CustomerName = 'Owner Lock'; // Placeholder
        $booking->CustomerMobile = '0000000000';
        $booking->CheckInDate = $request->start_date;
        $booking->CheckOutDate = $request->end_date;
        $booking->Guests = 0;
        $booking->Status = 'locked';
        $booking->save();

        return response()->json($booking);
    }

    // Approve a pending request
    public function approve($id)
    {
        $booking = Booking::findOrFail($id);
        $booking->Status = 'confirmed';
        $booking->save();
        
        return response()->json(['message' => 'Booking confirmed']);
    }
}
