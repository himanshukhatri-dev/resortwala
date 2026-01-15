<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;

class RevenueController extends Controller
{
    /**
     * Get all properties with their pricing data for the revenue dashboard.
     */
    public function properties(Request $request)
    {
        $properties = PropertyMaster::select([
            'PropertyId', 'Name', 'Location', 'Price', 'price_mon_thu', 'price_fri_sun', 'price_sat',
            'PerCost', 'ResortWalaRate', 'IsActive', 'admin_pricing'
        ])
        ->get();

        return response()->json([
            'success' => true,
            'data' => $properties
        ]);
    }

    /**
     * Get revenue analytics for the dashboard charts.
     */
    public function analytics(Request $request)
    {
        // Placeholder for real analytics if needed later
        return response()->json([
            'success' => true,
            'summary' => [
                'total_revenue' => \App\Models\Booking::where('Status', 'Confirmed')->sum('TotalAmount'),
                'avg_booking_value' => \App\Models\Booking::where('Status', 'Confirmed')->avg('TotalAmount') ?: 0,
                'total_bookings' => \App\Models\Booking::where('Status', 'Confirmed')->count(),
            ]
        ]);
    }

    /**
     * Default index for revenue.
     */
    public function index(Request $request)
    {
        return $this->analytics($request);
    }

    /**
     * Update pricing rates for a property.
     */
    public function updateRates(Request $request, $id)
    {
        $property = PropertyMaster::where('PropertyId', $id)->firstOrFail();
        
        $request->validate([
            'admin_pricing' => 'required|array',
            'price_mon_thu' => 'nullable|numeric',
            'price_fri_sun' => 'nullable|numeric',
            'price_sat' => 'nullable|numeric',
        ]);

        $property->update([
            'admin_pricing' => $request->admin_pricing,
            'price_mon_thu' => $request->price_mon_thu ?? $property->price_mon_thu,
            'price_fri_sun' => $request->price_fri_sun ?? $property->price_fri_sun,
            'price_sat' => $request->price_sat ?? $property->price_sat,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rates updated successfully'
        ]);
    }
}
