<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AIAssistantService;
use App\Models\AIChatConversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AIAssistantController extends Controller
{
    private $aiService;

    public function __construct(AIAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Send message to AI assistant
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'session_id' => 'required|string',
            'context' => 'nullable|string'
        ]);

        $vendorId = Auth::id();
        $message = $request->input('message');
        $sessionId = $request->input('session_id');
        $context = $request->input('context');

        $result = $this->aiService->generateResponse($vendorId, $message, $sessionId, $context);

        return response()->json([
            'status' => 'success',
            'data' => $result
        ]);
    }

    /**
     * Get chat history
     */
    public function getHistory(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string'
        ]);

        $vendorId = Auth::id();
        $sessionId = $request->query('session_id');

        $conversation = AIChatConversation::where('vendor_id', $vendorId)
            ->where('session_id', $sessionId)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $conversation ? $conversation->messages : []
        ]);
    }

    /**
     * Submit feedback for chat
     */
    public function submitFeedback(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'was_helpful' => 'nullable|boolean',
            'rating' => 'nullable|integer|min:1|max:5',
            'feedback' => 'nullable|string'
        ]);

        $vendorId = Auth::id();
        $sessionId = $request->input('session_id');

        $conversation = AIChatConversation::where('vendor_id', $vendorId)
            ->where('session_id', $sessionId)
            ->firstOrFail();

        $conversation->update($request->only(['was_helpful', 'rating', 'feedback']));

        return response()->json(['status' => 'success']);
    }
}
