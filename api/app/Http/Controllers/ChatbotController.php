<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatbotFaq;
use App\Models\ChatbotAnalytic;
use App\Models\CustomerQuery;
use App\Models\PropertyMaster;
use App\Services\WhatsApp\WhatsAppService;
use App\Services\WhatsApp\WhatsAppMessage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ChatbotController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    public function config()
    {
        try {
            // Fetch categorized FAQs
            $faqs = ChatbotFaq::where('is_active', true)
                ->where('visible_to_vendors', false)
                ->orderBy('priority', 'desc')
                ->get()
                ->groupBy('category');

            return response()->json([
                'success' => true,
                'data' => [
                    'title' => 'ResortWala Assistant',
                    'welcome_message' => '👋 Hi! Please select a topic below to get instant answers.',
                    'faqs_by_category' => $faqs,
                    'quick_actions' => [
                        ['id' => 'search', 'label' => '🔍 Find Property', 'action' => 'FORM_SEARCH'],
                        ['id' => 'human', 'label' => '👩‍💼 Talk to Agent', 'action' => 'LINK_WHATSAPP']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Chatbot Config Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to load chatbot config'], 500);
        }
    }

    public function track(Request $request)
    {
        // ... (Existing Analytics Logic)
        try {
            $validated = $request->validate([
                'interaction_type' => 'required|string',
                'faq_id' => 'nullable|exists:chatbot_faqs,id',
                'metadata' => 'nullable|array'
            ]);

            ChatbotAnalytic::create($validated);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }

    // 1. Smart Query Handler
    public function query(Request $request)
    {
        $question = $request->input('question');

        // A. Identify Intent (Regex / Keywords)
        if (preg_match('/(find|search|show|book|rent).*?(villa|hotel|room|property|resort|stay)/i', $question)) {
            return response()->json([
                'type' => 'action_trigger',
                'action' => 'FORM_SEARCH', // Triggers search form on client
                'message' => 'I can help you find a place! Let me search for available properties.'
            ]);
        }

        // B. Database Search (Full Text / Like)
        $term = '%' . $question . '%';
        $bestMatch = ChatbotFaq::where('is_active', true)
            ->where(function ($q) use ($term) {
                $q->where('question', 'like', $term)
                    ->orWhere('keywords', 'like', $term)
                    ->orWhere('answer', 'like', $term);
            })
            ->orderByRaw("
                CASE 
                    WHEN question LIKE ? THEN 10
                    WHEN keywords LIKE ? THEN 8
                    WHEN answer LIKE ? THEN 5
                    ELSE 0
                END DESC
            ", [$term, $term, $term])
            ->first();

        if ($bestMatch) {
            return response()->json([
                'type' => 'answer',
                'answer' => $bestMatch->answer,
                'action_type' => $bestMatch->action_type,
                'action_payload' => $bestMatch->action_payload
            ]);
        }

        // C. No Match -> Custom Query Escalation
        return response()->json([
            'type' => 'no_match',
            'message' => "I couldn't find an exact answer. I can send your question to our human support team immediately.",
            'show_escalation_form' => true
        ]);
    }

    // 2. Submit Custom Query
    public function submitQuery(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required',
            'name' => 'nullable|string',
            'mobile' => 'nullable|string',
            'page_context' => 'nullable|string'
        ]);

        // Save to DB
        $query = CustomerQuery::create([
            'question' => $validated['question'],
            'name' => $validated['name'],
            'mobile' => $validated['mobile'],
            'page_context' => $validated['page_context'],
            'status' => 'pending'
        ]);

        // Send WhatsApp to Admin
        // Assuming admin number is fixed or env
        $adminNumber = env('ADMIN_WHATSAPP_NUMBER', '919022510122'); // Fallback to Himanshu's number from plan?

        $text = "*New Customer Query*\n";
        $text .= "Name: " . ($validated['name'] ?? 'Guest') . "\n";
        $text .= "Phone: " . ($validated['mobile'] ?? 'N/A') . "\n";
        $text .= "Q: " . $validated['question'] . "\n";
        $text .= "Page: " . ($validated['page_context'] ?? 'N/A');

        $msg = new WhatsAppMessage(
            $adminNumber,
            $text
        );
        $this->whatsappService->send($msg);

        // TODO: Email Notification

        return response()->json([
            'success' => true,
            'message' => 'Your query has been sent! Our team will contact you shortly.'
        ]);
    }

    // 3. Property Search API Proxy for Chatbot (Mini Cards)
    public function searchProperties(Request $request)
    {
        $location = $request->input('location');
        $type = $request->input('type');

        $query = PropertyMaster::where('is_approved', 1)->limit(5);

        if ($location) {
            $query->where(function ($q) use ($location) {
                $q->where('Location', 'like', "%$location%")
                    ->orWhere('CityName', 'like', "%$location%")
                    ->orWhere('Name', 'like', "%$location%");
            });
        }

        if ($type) {
            if ($type == 'waterpark') {
                $query->where(function ($q) {
                    $q->where('PropertyType', 'like', '%Resort%')
                        ->orWhere('PropertyType', 'like', '%Water%')
                        ->orWhere('Name', 'like', '%Water%');
                });
            } else {
                // Handle 'villas' vs 'Villa' or any other type
                $searchTerm = str_ireplace('villas', 'Villa', $type);
                $query->where('PropertyType', 'like', "%$searchTerm%");
            }
        }

        $properties = $query->with('images')->get()->map(function ($p) {
            return [
                'id' => $p->PropertyId,
                'name' => $p->Name,
                'location' => $p->Location,
                'price' => $p->Price,
                'image' => $p->images->first()->image_url ?? $p->image_url ?? '',
                'rating' => $p->Rating ?? 4.5,
                'url' => "/property/" . $p->PropertyId
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $properties
        ]);
    }
}
