<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\WalkthroughService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalkthroughController extends Controller
{
    private $walkthroughService;

    public function __construct(WalkthroughService $walkthroughService)
    {
        $this->walkthroughService = $walkthroughService;
    }

    /**
     * Get walkthrough for a specific page route
     */
    public function getForPage(Request $request)
    {
        $request->validate([
            'route' => 'required|string'
        ]);

        $vendorId = Auth::id();
        $route = $request->query('route');

        $walkthrough = $this->walkthroughService->getWalkthroughForPage($route, $vendorId);

        if (!$walkthrough) {
            return response()->json([
                'status' => 'success',
                'data' => null, // No walkthrough for this page
                'message' => 'No active walkthrough found for this route'
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $walkthrough
        ]);
    }

    /**
     * Update walkthrough progress
     */
    public function updateProgress(Request $request, $id)
    {
        $request->validate([
            'page_route' => 'required|string',
            'status' => 'nullable|in:not_started,in_progress,completed,skipped,dismissed',
            'current_step' => 'nullable|integer',
            'total_steps' => 'nullable|integer'
        ]);

        $vendorId = Auth::id();

        $progress = $this->walkthroughService->updateProgress($vendorId, $id, $request->all());

        return response()->json([
            'status' => 'success',
            'data' => $progress
        ]);
    }
}
