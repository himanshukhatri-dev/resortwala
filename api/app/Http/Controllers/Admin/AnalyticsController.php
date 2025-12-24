<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get event logs with filtering and pagination
     */
    public function getEventLogs(Request $request)
    {
        $query = DB::table('user_events')
            ->orderBy('created_at', 'desc');

        // Filter by event type
        if ($request->has('event_type') && $request->event_type) {
            $query->where('event_type', $request->event_type);
        }

        // Filter by category
        if ($request->has('event_category') && $request->event_category) {
            $query->where('event_category', $request->event_category);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('created_at', '<=', $request->end_date);
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $events = $query->paginate($perPage);

        // Parse JSON fields
        $events->getCollection()->transform(function ($event) {
            $event->event_data = json_decode($event->event_data, true);
            $event->context = json_decode($event->context, true);
            return $event;
        });

        return response()->json($events);
    }

    /**
     * Get event statistics
     */
    public function getEventStats(Request $request)
    {
        $hours = $request->get('hours', 24);
        
        $stats = [
            'total_events' => DB::table('user_events')
                ->where('created_at', '>', now()->subHours($hours))
                ->count(),
            
            'by_type' => DB::table('user_events')
                ->select('event_type', DB::raw('COUNT(*) as count'))
                ->where('created_at', '>', now()->subHours($hours))
                ->groupBy('event_type')
                ->orderBy('count', 'desc')
                ->get(),
            
            'by_category' => DB::table('user_events')
                ->select('event_category', DB::raw('COUNT(*) as count'))
                ->where('created_at', '>', now()->subHours($hours))
                ->groupBy('event_category')
                ->orderBy('count', 'desc')
                ->get(),
            
            'unique_sessions' => DB::table('user_events')
                ->where('created_at', '>', now()->subHours($hours))
                ->distinct('session_id')
                ->count('session_id'),
            
            'unique_users' => DB::table('user_events')
                ->where('created_at', '>', now()->subHours($hours))
                ->whereNotNull('user_id')
                ->distinct('user_id')
                ->count('user_id'),
        ];

        return response()->json($stats);
    }

    /**
     * Get distinct event types and categories
     */
    public function getEventFilters()
    {
        return response()->json([
            'event_types' => DB::table('user_events')
                ->distinct()
                ->pluck('event_type'),
            'event_categories' => DB::table('user_events')
                ->distinct()
                ->pluck('event_category')
        ]);
    }
}
