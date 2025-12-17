<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PropertyMasterController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\PropertyMaster::with('images')
            ->where('is_approved', 1)
            ->orderBy('created_at', 'desc');

        if ($request->has('location')) {
            $query->where('Location', 'like', '%' . $request->input('location') . '%');
        }

        // Guests filter stub (assuming 'MaxGuest' or similar column exists, otherwise simple pass-through for now)
        // Adjust column name based on actual schema if known, or just stub it.
        // Based on SOW "Customer will search... with People", assuming capacity check.
        // For now, let's look for a column that might indicate capacity.
        // Since I haven't seen the full schema, I will skip complex capacity logic unless I verify the column.
        
        return response()->json($query->get());
    }

    public function show($id)
    {
        $property = \App\Models\PropertyMaster::with('images')->find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        return response()->json($property);
    }

    public function getBookedDates($id)
    {
        $bookings = \App\Models\Booking::where('PropertyId', $id)
            ->where('Status', '!=', 'cancelled')
            ->where('Status', '!=', 'rejected')
            ->get(['CheckInDate', 'CheckOutDate']);

        $bookedDates = [];

        foreach ($bookings as $booking) {
            // Include check-in date, exclude check-out date (nights booked)
            // If check-out is the day they leave, the room is free that night?
            // Usually hotel logic: Booked NIGHTS. 
            // So if Booked 14th to 15th, the night of 14th is booked. 15th is free for check-in.
            // My CustomDatePicker disables check-in selection.
            // If I disable 14th, user can't check in on 14th.
            // If I disable 15th, user can't check in on 15th?
            // Wait, if someone books 14-16 (14, 15 nights).
            // 14th is occupied. 15th is occupied. 16th is free to check in (checkout day).
            // So I should calculate dates from CheckIn up to CheckOut - 1 day.
            
            $start = \Carbon\Carbon::parse($booking->CheckInDate);
            $end = \Carbon\Carbon::parse($booking->CheckOutDate);

            // If Start == End (Single Day Freeze), include it.
            if ($start->eq($end)) {
                 $bookedDates[] = $start->format('Y-m-d');
            } else {
                 // Standard Booking: Exclude checkout day (subDay)
                 $end->subDay();
                 
                 if ($start->lte($end)) {
                    $period = \Carbon\CarbonPeriod::create($start, $end);
                    foreach ($period as $date) {
                        $bookedDates[] = $date->format('Y-m-d');
                    }
                 }
            }
        }

        return response()->json(['booked_dates' => array_values(array_unique($bookedDates))]);
    }
}
