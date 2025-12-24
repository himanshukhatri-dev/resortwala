<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\TrackEventJob;

class EventController extends Controller
{
    /**
     * Track user event
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:64',
            'event_type' => 'required|string|max:50',
            'event_category' => 'required|string|max:50',
            'event_data' => 'required|array',
            'context' => 'required|array'
        ]);

        // Add user_id from auth if available
        $validated['user_id'] = auth()->id();

        // Dispatch to queue for async processing
        TrackEventJob::dispatch($validated);

        return response()->json([
            'status' => 'queued',
            'message' => 'Event tracking queued successfully'
        ]);
    }

    /**
     * Batch track multiple events
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function batchTrack(Request $request)
    {
        $validated = $request->validate([
            'events' => 'required|array|min:1|max:50',
            'events.*.session_id' => 'required|string|max:64',
            'events.*.event_type' => 'required|string|max:50',
            'events.*.event_category' => 'required|string|max:50',
            'events.*.event_data' => 'required|array',
            'events.*.context' => 'required|array'
        ]);

        $userId = auth()->id();

        foreach ($validated['events'] as $event) {
            $event['user_id'] = $userId;
            TrackEventJob::dispatch($event);
        }

        return response()->json([
            'status' => 'queued',
            'count' => count($validated['events']),
            'message' => count($validated['events']) . ' events queued successfully'
        ]);
    }
}
