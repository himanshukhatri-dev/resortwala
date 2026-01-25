<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\PropertyMaster;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AvailabilityService
{
    /**
     * Get availability for a property
     */
    public function getAvailability($propertyId, $startDate = null, $endDate = null)
    {
        $property = PropertyMaster::findOrFail($propertyId);
        $startDate = $startDate ? Carbon::parse($startDate) : Carbon::today();
        $endDate = $endDate ? Carbon::parse($endDate) : Carbon::today()->addMonths(3);

        Log::info("Availability Request for Property: {$propertyId}", $property->toArray());

        $propertyType = strtolower($property->PropertyType ?? '');
        $isWaterpark = str_contains($propertyType, 'water') || str_contains($propertyType, 'waterpark');

        Log::info("Categorization for {$propertyId}: isWaterpark=" . ($isWaterpark ? 'YES' : 'NO'));

        if ($isWaterpark) {
            return [
                'property_type' => 'waterpark',
                'availability_type' => 'waterpark',
                'blocked_dates' => [], // Waterparks are always "open" for now as per "no capacity check"
                'blocked_ranges' => [],
                'status' => 'available'
            ];
        }

        // Villa Logic: Exclusive Booking
        $query = Booking::where('PropertyId', $propertyId)
            ->whereIn('Status', ['Confirmed', 'locked', 'booked', 'Pending', 'confirmed', 'Locked', 'Booked', 'pending', 'locked_by_admin'])
            ->where(function ($q) {
                // Ignore expired pending bookings
                $q->whereNotIn('Status', ['Pending', 'pending'])
                    ->orWhere('created_at', '>', now()->subHours(24));
            })
            ->where('CheckInDate', '<=', $endDate->toDateString())
            ->where('CheckOutDate', '>=', $startDate->toDateString());

        Log::info("Availability SQL for {$propertyId}: " . $query->toSql(), $query->getBindings());

        $bookings = $query->get(['CheckInDate', 'CheckOutDate', 'Status']);

        Log::info("Found " . $bookings->count() . " bookings for property {$propertyId}");

        $blockedDates = [];
        $blockedRanges = [];

        foreach ($bookings as $booking) {
            $checkIn = Carbon::parse($booking->CheckInDate);
            $checkOut = Carbon::parse($booking->CheckOutDate);

            Log::info("Booking Found: {$booking->CheckInDate} to {$booking->CheckOutDate} [Status: {$booking->Status}]");

            $blockedRanges[] = [
                'start' => $checkIn->toDateString(),
                'end' => $checkOut->toDateString()
            ];

            // Fill individual dates
            $current = $checkIn->copy();
            while ($current->lt($checkOut)) {
                $blockedDates[] = $current->toDateString();
                $current->addDay();
            }
        }

        $result = [
            'property_type' => 'villa',
            'availability_type' => 'villa',
            'blocked_dates' => array_values(array_unique($blockedDates)),
            'blocked_ranges' => $blockedRanges,
            'status' => count($blockedDates) > 0 ? 'partially_booked' : 'available'
        ];

        Log::info("Final Availability Result for {$propertyId}:", [
            'blocked_count' => count($result['blocked_dates']),
            'dates' => $result['blocked_dates']
        ]);

        return $result;
    }

    /**
     * Check if a specific range is available
     */
    public function isAvailable($propertyId, $startDate, $endDate, $guests = 1)
    {
        $property = PropertyMaster::findOrFail($propertyId);
        $propertyType = strtolower($property->PropertyType ?? '');
        $isWaterpark = str_contains($propertyType, 'water') || str_contains($propertyType, 'waterpark');

        if ($isWaterpark) {
            return true; // No capacity check as per request
        }

        // Villa overlap check
        return !Booking::where('PropertyId', $propertyId)
            ->whereIn('Status', ['Confirmed', 'locked', 'booked', 'Pending', 'confirmed', 'Locked', 'Booked', 'pending', 'locked_by_admin'])
            ->where(function ($q) {
                $q->whereNotIn('Status', ['Pending', 'pending'])
                    ->orWhere('created_at', '>', now()->subHours(24));
            })
            ->where(function ($q) use ($startDate, $endDate) {
                $q->where('CheckInDate', '<', $endDate)
                    ->where('CheckOutDate', '>', $startDate);
            })
            ->exists();
    }
}
