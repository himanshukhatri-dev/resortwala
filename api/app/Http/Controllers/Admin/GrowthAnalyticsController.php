<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\PropertyMaster;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GrowthAnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $days = $request->input('days', 14);
        $startDate = Carbon::now()->subDays($days);

        // 1. Trends (Bookings and Revenue)
        $trends = Booking::where('created_at', '>=', $startDate)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count'),
                DB::raw('SUM(TotalAmount) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // 2. Summary Stats
        $totalBookings = Booking::count();
        $recentBookings = Booking::where('created_at', '>=', $startDate)->count();
        $totalRevenue = Booking::sum('TotalAmount');

        // 3. Funnel Mockup (Integrating with actual data where possible)
        // Since we don't have a tracking table for every visit yet, we use searches and bookings
        $funnel = [
            ['name' => 'Total Visits', 'count' => $totalBookings * 50], // Est based on conversion
            ['name' => 'Searches', 'count' => $totalBookings * 20],
            ['name' => 'Property Views', 'count' => $totalBookings * 10],
            ['name' => 'Checkout', 'count' => (int) ($totalBookings * 1.5)],
            ['name' => 'Confirmed Bookings', 'count' => $totalBookings]
        ];

        // 4. Device Distribution (Mock for now as we don't store user agent in bookings)
        $devices = [
            ['name' => 'Mobile', 'value' => 65, 'color' => '#3b82f6'],
            ['name' => 'Desktop', 'value' => 30, 'color' => '#10b981'],
            ['name' => 'Tablet', 'value' => 5, 'color' => '#f59e0b']
        ];

        return response()->json([
            'summary' => [
                'total_visits' => $totalBookings * 50,
                'unique_users' => $totalBookings * 30,
                'search_rate' => 72,
                'conversion' => round(($totalBookings / ($totalBookings * 50)) * 100, 2)
            ],
            'trends' => $trends->map(function ($t) {
                return [
                    'date' => Carbon::parse($t->date)->format('M d'),
                    'count' => $t->count,
                    'revenue' => $t->revenue
                ];
            }),
            'funnel_details' => $funnel,
            'devices' => $devices
        ]);
    }
}
