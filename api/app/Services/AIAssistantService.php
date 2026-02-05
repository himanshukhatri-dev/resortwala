<?php

namespace App\Services;

use App\Models\AIChatConversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAssistantService
{
    private $openAIKey;
    private $googleKey;
    private $openAIEndpoint = 'https://api.openai.com/v1/chat/completions';
    private $geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function __construct()
    {
        $this->openAIKey = config('services.openai.api_key');
        $this->googleKey = env('GOOGLE_API_KEY');
    }

    /**
     * Generate a response for the user
     */
    public function generateResponse(int $vendorId, string $message, string $sessionId, ?string $context = null): array
    {
        // 1. Retrieve or create conversation history
        $conversation = AIChatConversation::firstOrCreate(
            ['session_id' => $sessionId, 'vendor_id' => $vendorId],
            ['messages' => [], 'started_at' => now()]
        );

        $messages = $conversation->messages ?? [];

        // 2. Add user message
        $messages[] = ['role' => 'user', 'content' => $message];

        // 3. Prepare system prompt with context
        $systemPrompt = $this->buildSystemPrompt($context);

        $botResponse = '';

        // 4. Select Provider (Prioritize Gemini Free Tier)
        if ($this->googleKey) {
            $botResponse = $this->callGemini($messages, $systemPrompt);
        } elseif ($this->openAIKey) {
            $botResponse = $this->callOpenAI($messages, $systemPrompt);
        } else {
            $botResponse = "I'm a simulated AI assistant. I see you asked: '$message'. Please configure GOOGLE_API_KEY (Free) or OPENAI_API_KEY in your .env file to get real responses.";
        }

        // 5. Add bot response and save
        $messages[] = ['role' => 'assistant', 'content' => $botResponse];

        $conversation->messages = $messages;
        $conversation->last_message_at = now();
        $conversation->save();

        return [
            'message' => $botResponse,
            'history' => $messages
        ];
    }

    private function callGemini(array $messages, string $systemPrompt): string
    {
        try {
            // Convert messages to Gemini format (strictly user/model)
            $contents = [];

            // Append last 10 messages with alternation check
            $recentMessages = array_slice($messages, -10);
            foreach ($recentMessages as $msg) {
                $role = $msg['role'] === 'user' ? 'user' : 'model';

                // Gemini rejects non-alternating roles. Force alternation by merging consecutive roles.
                if (!empty($contents) && end($contents)['role'] === $role) {
                    $lastIdx = count($contents) - 1;
                    $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $msg['content'];
                } else {
                    $contents[] = [
                        'role' => $role,
                        'parts' => [['text' => $msg['content']]]
                    ];
                }
            }

            // Gemini REQUIREMENT: First message MUST be 'user'
            if (!empty($contents) && $contents[0]['role'] !== 'user') {
                array_unshift($contents, [
                    'role' => 'user',
                    'parts' => [['text' => "Hello assistant."]]
                ]);
            }

            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->withOptions(['verify' => false])
                ->post("{$this->geminiEndpoint}?key={$this->googleKey}", [
                    'contents' => $contents,
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'maxOutputTokens' => 1000,
                    ]
                ]);

            if ($response->successful()) {
                return $response->json('candidates.0.content.parts.0.text') ?? "I'm sorry, I couldn't generate a response.";
            }

            $error = $response->json();
            Log::error('Gemini API Error', ['error' => $error, 'payload' => $contents]);

            // Inform the user about the specific refusal if possible
            $msg = $error['error']['message'] ?? 'Refusal';
            return "Connection established, but Gemini is refusing ($msg). I'm adjusting the prompt logic now.";

        } catch (\Exception $e) {
            Log::error('Gemini Connection Error: ' . $e->getMessage());
            return "I'm experiencing a technical connection glitch with Gemini.";
        }
    }

    private function callOpenAI(array $messages, string $systemPrompt): string
    {
        try {
            $apiMessages = array_merge(
                [['role' => 'system', 'content' => $systemPrompt]],
                array_slice($messages, -10)
            );

            $response = Http::withToken($this->openAIKey)->post($this->openAIEndpoint, [
                'model' => 'gpt-3.5-turbo',
                'messages' => $apiMessages,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }

            Log::error('OpenAI API Error', $response->json());
            return "I'm having trouble connecting to OpenAI.";

        } catch (\Exception $e) {
            Log::error('OpenAI Connection Error: ' . $e->getMessage());
            return "I'm experiencing a technical glitch.";
        }
    }

    private function buildSystemPrompt(?string $context): string
    {
        $basePrompt = "You are the ResortWala Master Assistant. 
        1. Tone: Professional, warm, and highly efficient. 
        2. Knowledge: You know everything about the ResortWala Vendor Panel (Dashboard, Properties, Bookings, Calendar, Learning).
        3. Rules: Do NOT mention you are an AI. Do NOT give generic advice. Give specific steps for ResortWala.
        4. Conciseness: Keep responses under 3 paragraphs unless a guide is requested.";

        if ($context) {
            $basePrompt .= "\n\nCurrent Context: $context";
        }

        return $basePrompt;
    }
}
