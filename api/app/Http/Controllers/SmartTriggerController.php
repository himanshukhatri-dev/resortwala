<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\TriggerEvaluationService;
use App\Models\VendorTriggerHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SmartTriggerController extends Controller
{
    private $triggerService;

    public function __construct(TriggerEvaluationService $triggerService)
    {
        $this->triggerService = $triggerService;
    }

    /**
     * Check for active triggers on a page
     */
    public function checkTriggers(Request $request)
    {
        $request->validate([
            'page_route' => 'required|string',
            'context' => 'nullable|array'
        ]);

        $vendorId = Auth::id();
        $pageRoute = $request->input('page_route');
        $context = $request->input('context', []);

        $trigger = $this->triggerService->evaluateTriggers($vendorId, $pageRoute, $context);

        if (!$trigger) {
            return response()->json([
                'status' => 'success',
                'data' => null
            ]);
        }

        // Log overlap/attempt here if needed, but usually we log when user *sees* or *acts*
        // For now, we return the trigger config

        return response()->json([
            'status' => 'success',
            'data' => $trigger
        ]);
    }

    /**
     * Record trigger interaction (viewed, dismissed, accepted)
     */
    public function recordInteraction(Request $request)
    {
        $request->validate([
            'trigger_rule_id' => 'required|exists:smart_trigger_rules,id',
            'action' => 'required|in:viewed,dismissed,accepted,ignored',
            'page_route' => 'nullable|string',
            'session_id' => 'nullable|string'
        ]);

        $vendorId = Auth::id();

        $history = VendorTriggerHistory::create([
            'vendor_id' => $vendorId,
            'trigger_rule_id' => $request->trigger_rule_id,
            'triggered_at' => now(),
            'page_route' => $request->page_route,
            'vendor_action' => $request->action === 'viewed' ? null : $request->action, // 'viewed' is just logging the event
            'action_taken_at' => $request->action !== 'viewed' ? now() : null,
            'session_id' => $request->session_id
        ]);

        return response()->json(['status' => 'success']);
    }
}
