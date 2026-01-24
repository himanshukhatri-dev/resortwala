<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Batch event tracking from client SDK
     */
    public function batch(Request $request)
    {
        try {
            $events = $request->input('events', []);
            // Explicitly try Sanctum guard for API context if not already authenticated
            $user = auth('sanctum')->user() ?: auth()->user();
            $ip = $request->ip();
            $ua = $request->userAgent();

            foreach ($events as $eventData) {
                EventLog::create([
                    'event_name' => $eventData['event_type'] ?? 'unknown',
                    'event_category' => $eventData['event_category'] ?? 'customer',
                    'user_id' => $user ? $user->id : null,
                    'role' => $user ? $user->role : 'guest',
                    'session_id' => $eventData['session_id'] ?? null,
                    'metadata' => $eventData['event_data'] ?? [],
                    'ip_address' => $ip,
                    'user_agent' => $ua,
                    'status' => 'success',
                    'created_at' => $eventData['event_data']['timestamp'] ?? now(),
                ]);
            }

            return response()->json(['status' => 'success', 'processed' => count($events)]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Client-side event tracking (Single)
     */
    public function track(Request $request)
    {
        try {
            $user = auth('sanctum')->user() ?: auth()->user();

            EventLog::create([
                'event_name' => $request->input('event_name'),
                'event_category' => $request->input('event_category', 'customer'),
                'user_id' => $user ? $user->id : null,
                'role' => $user ? $user->role : 'guest',
                'session_id' => $request->header('X-Session-ID') ?: $request->input('session_id'),
                'entity_type' => $request->input('entity_type'),
                'entity_id' => $request->input('entity_id'),
                'screen_name' => $request->input('screen_name'),
                'action' => $request->input('action'),
                'metadata' => $request->input('metadata', []),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status' => 'success'
            ]);

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Dashboard KPIs and Charts
     */
    public function dashboard(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
        $thisMonthStart = Carbon::now()->startOfMonth();

        // 1. Financial KPIs & Trends
        $revenueTotal = \App\Models\Booking::where('Status', 'confirmed')->sum('TotalAmount');
        $revenueMonth = \App\Models\Booking::where('Status', 'confirmed')
            ->where('CheckInDate', '>=', $thisMonthStart)
            ->sum('TotalAmount');
        $revenueLastMonth = \App\Models\Booking::where('Status', 'confirmed')
            ->whereBetween('CheckInDate', [$lastMonthStart, $lastMonthEnd])
            ->sum('TotalAmount');

        $revenueGrowth = $revenueLastMonth > 0 ? round((($revenueMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1) : 0;

        // 2. Engagement KPIs & Trends
        $totalInteractions = EventLog::where('created_at', '>=', $startDate)->count();
        $dau = EventLog::where('created_at', '>=', Carbon::today())
            ->distinct('session_id')
            ->count();

        // 3. Inventory Stats & Trends
        $activeInventory = \App\Models\PropertyMaster::where('is_approved', true)->count();
        $pendingApprovals = \App\Models\PropertyMaster::where('is_approved', false)->count();
        $inventoryLastMonth = \App\Models\PropertyMaster::where('is_approved', true)
            ->where('created_at', '<', $thisMonthStart)
            ->count();

        $inventoryGrowth = $inventoryLastMonth > 0 ? round((($activeInventory - $inventoryLastMonth) / $inventoryLastMonth) * 100, 1) : 0;

        // 4. Trends (Revenue & Traffic)
        $revenueTrends = \App\Models\Booking::select(
            DB::raw('DATE(CheckInDate) as date'),
            DB::raw('SUM(TotalAmount) as revenue')
        )
            ->where('Status', 'confirmed')
            ->where('CheckInDate', '>=', $startDate)
            ->groupBy('date')
            ->get();

        $trafficTrends = EventLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count'),
            DB::raw('count(distinct session_id) as users')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 5. Funnel (Consolidated)
        $funnel = [
            'total_users' => EventLog::distinct('session_id')->count(),
            'property_views' => EventLog::where('event_name', 'property_detail_view')->count(),
            'checkouts' => EventLog::where('event_name', 'checkout_started')->count(),
            'bookings' => \App\Models\Booking::count(),
        ];

        return response()->json([
            'kpis' => [
                'total_revenue' => $revenueTotal,
                'monthly_revenue' => $revenueMonth,
                'revenue_growth' => $revenueGrowth,
                'interactions' => $totalInteractions,
                'active_users_today' => $dau,
                'active_inventory' => $activeInventory,
                'inventory_growth' => $inventoryGrowth,
                'pending_approvals' => $pendingApprovals
            ],
            'revenue_trends' => $revenueTrends,
            'traffic_trends' => $trafficTrends,
            'funnel' => $funnel
        ]);
    }

    /**
     * Get Paginated Event Logs
     */
    public function getEventLogs(Request $request)
    {
        $query = EventLog::query();

        if ($request->filled('event_type')) {
            $query->where('event_name', $request->event_type);
        }
        if ($request->filled('event_category')) {
            $query->where('event_category', $request->event_category);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        $logs = $query->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($logs);
    }

    /**
     * Get Analytics Stats
     */
    public function getEventStats()
    {
        $last24h = Carbon::now()->subDay();

        return response()->json([
            'total_events' => EventLog::where('created_at', '>=', $last24h)->count(),
            'unique_sessions' => EventLog::where('created_at', '>=', $last24h)->distinct('session_id')->count(),
            'unique_users' => EventLog::where('created_at', '>=', $last24h)->whereNotNull('user_id')->distinct('user_id')->count(),
            'by_type' => EventLog::select('event_name as event_type', DB::raw('count(*) as count'))
                ->where('created_at', '>=', $last24h)
                ->groupBy('event_name')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get()
        ]);
    }

    /**
     * Get Available Filters
     */
    public function getEventFilters()
    {
        return response()->json([
            'event_types' => EventLog::distinct()->pluck('event_name'),
            'event_categories' => EventLog::distinct()->pluck('event_category')
        ]);
    }

    /**
     * Platform-wide Global Search Index
     */
    public function search(Request $request)
    {
        $query = $request->input('query');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. Search Properties
        $properties = \App\Models\PropertyMaster::where('PropertyName', 'LIKE', "%{$query}%")
            ->orWhere('Location', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['PropertyId as id', 'PropertyName as name', 'Location'])
            ->map(function ($item) {
                $item->type = 'property';
                return $item;
            });
        $results = array_merge($results, $properties->toArray());

        // 2. Search Users (Admins/Vendors)
        $users = \App\Models\User::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'email', 'role'])
            ->map(function ($item) {
                $item->type = 'user';
                return $item;
            });
        $results = array_merge($results, $users->toArray());

        // 3. Search Customers
        $customers = \App\Models\Customer::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orWhere('phone', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'email', 'phone'])
            ->map(function ($item) {
                $item->type = 'customer';
                return $item;
            });
        $results = array_merge($results, $customers->toArray());

        return response()->json($results);
    }
}
