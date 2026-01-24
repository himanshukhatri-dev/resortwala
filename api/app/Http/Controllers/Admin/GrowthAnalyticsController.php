<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventLog;
use App\Models\PropertyMaster;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GrowthAnalyticsController extends Controller
{
    /**
     * Get Growth Overview Metrics
     */
    public function overview(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        // 1. Landing Page Metrics
        $totalVisits = EventLog::where('event_name', 'page_view')
            ->where('created_at', '>=', $startDate)
            ->count();

        $uniqueUsers = EventLog::where('created_at', '>=', $startDate)
            ->distinct('session_id')
            ->count();

        $searchInitiated = EventLog::where('event_name', 'search')
            ->where('created_at', '>=', $startDate)
            ->count();

        // 2. Search Results Metrics
        $impressions = EventLog::where('event_name', 'property_view')
            ->where('event_category', 'discovery')
            ->where('created_at', '>=', $startDate)
            ->count();

        // 3. Conversion Funnel
        $funnel = [
            'visits' => $totalVisits,
            'searches' => $searchInitiated,
            'property_views' => EventLog::where('event_name', 'property_detail_view')->where('created_at', '>=', $startDate)->count(),
            'checkout_starts' => EventLog::where('event_name', 'checkout_started')->where('created_at', '>=', $startDate)->count(),
            'bookings' => Booking::where('created_at', '>=', $startDate)->count(),
        ];

        return response()->json([
            'summary' => [
                'total_visits' => $totalVisits,
                'unique_users' => $uniqueUsers,
                'search_rate' => $totalVisits > 0 ? round(($searchInitiated / $totalVisits) * 100, 2) : 0,
                'avg_time_on_page' => 0, // Placeholder
            ],
            'funnel' => $funnel,
            'trends' => $this->getTrends($startDate)
        ]);
    }

    /**
     * Get Click & Search Behavior Intelligence
     */
    public function behavior(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        // Filter Usage
        $filterUsage = EventLog::where('event_name', 'search')
            ->where('created_at', '>=', $startDate)
            ->get()
            ->pluck('metadata.filters')
            ->flatten()
            ->countBy()
            ->sortDesc()
            ->take(10);

        // Sort Usage
        $sortUsage = EventLog::where('event_name', 'search')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw("JSON_EXTRACT(metadata, '$.filters.sort') as sort_type"), DB::raw("count(*) as count"))
            ->groupBy('sort_type')
            ->get();

        return response()->json([
            'filter_usage' => $filterUsage,
            'sort_usage' => $sortUsage,
            'device_segmentation' => $this->getDeviceSegmentation($startDate)
        ]);
    }

    /**
     * Business Insights Engine
     */
    public function insights(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        // 1. Top Converting Properties
        $topConverting = Booking::select('PropertyId', DB::raw('count(*) as booking_count'))
            ->where('created_at', '>=', $startDate)
            ->where('Status', 'confirmed')
            ->groupBy('PropertyId')
            ->orderBy('booking_count', 'desc')
            ->with([
                'property' => function ($q) {
                    $q->select('PropertyId', 'Name', 'Location');
                }
            ])
            ->limit(5)
            ->get();

        // 2. Click-Through Rate (CTR) Per Property
        // Views / Impressions
        $propertyCTR = EventLog::select(
            'entity_id as property_id',
            DB::raw("SUM(CASE WHEN event_name = 'property_detail_view' THEN 1 ELSE 0 END) as views"),
            DB::raw("SUM(CASE WHEN event_name = 'property_view' THEN 1 ELSE 0 END) as impressions")
        )
            ->whereIn('event_name', ['property_detail_view', 'property_view'])
            ->where('created_at', '>=', $startDate)
            ->groupBy('property_id')
            ->get()
            ->map(function ($item) {
                $item->ctr = $item->impressions > 0 ? round(($item->views / $item->impressions) * 100, 2) : 0;
                return $item;
            })
            ->sortByDesc('ctr')
            ->take(10)
            ->values();

        // 3. Search Abandonment
        // Searches with no property view in same session
        $abandonedSearchesCount = 0; // Requires complex session-level aggregation

        return response()->json([
            'top_performing' => $topConverting,
            'ctr_leaderboard' => $propertyCTR,
            'anomalies' => [
                'dead_inventory' => $this->getDeadInventory($startDate)
            ]
        ]);
    }

    private function getTrends($startDate)
    {
        return EventLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getDeviceSegmentation($startDate)
    {
        return EventLog::where('created_at', '>=', $startDate)
            ->select('device_type', DB::raw('count(*) as count'))
            ->groupBy('device_type')
            ->get();
    }

    private function getDeadInventory($startDate)
    {
        // Properties with high impressions but 0 clicks
        return PropertyMaster::where('is_approved', 1)
            ->whereNotExists(function ($query) use ($startDate) {
                $query->select(DB::raw(1))
                    ->from('event_logs')
                    ->whereRaw('event_logs.entity_id = property_masters.PropertyId')
                    ->where('event_name', 'property_detail_view')
                    ->where('created_at', '>=', $startDate);
            })
            ->limit(10)
            ->get(['PropertyId', 'Name']);
    }
}
