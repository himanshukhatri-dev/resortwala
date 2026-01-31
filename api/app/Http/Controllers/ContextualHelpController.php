<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ContextualHelpContent;
use App\Models\HelpInteractionAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContextualHelpController extends Controller
{
    /**
     * Get contextual help for a specific page route
     */
    public function getForPage(Request $request)
    {
        $request->validate([
            'route' => 'required|string'
        ]);

        $route = $request->query('route');

        $content = ContextualHelpContent::where('page_route', $route)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $content
        ]);
    }

    /**
     * Track help interaction
     */
    public function trackInteraction(Request $request)
    {
        $request->validate([
            'interaction_type' => 'required|string',
            'resource_type' => 'required|string',
            'resource_id' => 'nullable|integer',
            'page_route' => 'nullable|string'
        ]);

        $vendorId = Auth::id();

        HelpInteractionAnalytics::create([
            'vendor_id' => $vendorId,
            'interaction_type' => $request->interaction_type,
            'resource_type' => $request->resource_type,
            'resource_id' => $request->resource_id,
            'page_route' => $request->page_route,
            'trigger_source' => $request->input('trigger_source', 'manual'),
            'session_id' => $request->input('session_id'),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json(['status' => 'success']);
    }
}
