<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatbotFaq;
use App\Models\ChatbotAnalytic;
use Illuminate\Support\Facades\Log;

class AdminChatbotController extends Controller
{
    public function index()
    {
        $faqs = ChatbotFaq::orderBy('priority', 'desc')->get();
        return response()->json(['success' => true, 'data' => $faqs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'action_type' => 'required|in:none,link,whatsapp,form',
            'action_payload' => 'nullable|array',
            'priority' => 'integer',
            'is_active' => 'boolean'
        ]);

        $faq = ChatbotFaq::create($validated);
        return response()->json(['success' => true, 'data' => $faq]);
    }

    public function update(Request $request, $id)
    {
        $faq = ChatbotFaq::findOrFail($id);
        
        $validated = $request->validate([
            'question' => 'string|max:255',
            'answer' => 'string',
            'action_type' => 'in:none,link,whatsapp,form',
            'action_payload' => 'nullable|array',
            'priority' => 'integer',
            'is_active' => 'boolean'
        ]);

        $faq->update($validated);
        return response()->json(['success' => true, 'data' => $faq]);
    }

    public function destroy($id)
    {
        $faq = ChatbotFaq::findOrFail($id);
        $faq->delete();
        return response()->json(['success' => true]);
    }

    public function analytics()
    {
        // Simple counts for dashboard
        $stats = [
            'total_interactions' => ChatbotAnalytic::count(),
            'opens' => ChatbotAnalytic::where('interaction_type', 'open')->count(),
            'whatsapp_clicks' => ChatbotAnalytic::where('interaction_type', 'whatsapp_click')->count(),
            'top_questions' => ChatbotAnalytic::where('interaction_type', 'question_click')
                ->selectRaw('faq_id, count(*) as count')
                ->groupBy('faq_id')
                ->with('faq')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }
}
