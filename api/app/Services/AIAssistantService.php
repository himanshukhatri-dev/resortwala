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
    private $geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    public function __construct()
    {
        $this->openAIKey = config('services.openai.api_key');
        $this->googleKey = env('GOOGLE_API_KEY'); // Direct env access for simplicity or add to config
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
            // Convert messages to Gemini format
            // Gemini expects: contents: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
            $geminiHistory = [];

            // Add system prompt as the first user message for context
            $geminiHistory[] = [
                'role' => 'user',
                'parts' => [['text' => "System Instructions:\n" . $systemPrompt]]
            ];
            $geminiHistory[] = [
                'role' => 'model',
                'parts' => [['text' => "Understood. I am ready to help as the ResortWala Vendor Assistant."]]
            ];

            // Append last 10 messages
            $recentMessages = array_slice($messages, -10);
            foreach ($recentMessages as $msg) {
                $role = $msg['role'] === 'user' ? 'user' : 'model';
                $geminiHistory[] = [
                    'role' => $role,
                    'parts' => [['text' => $msg['content']]]
                ];
            }

            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->withOptions(['verify' => false]) // Fix for local SSL error (Windows)
                ->post("{$this->geminiEndpoint}?key={$this->googleKey}", [
                    'contents' => $geminiHistory,
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 800,
                    ]
                ]);

            if ($response->successful()) {
                // Gemini response structure: candidates[0].content.parts[0].text
                return $response->json('candidates.0.content.parts.0.text') ?? "I'm sorry, I couldn't generate a response.";
            }

            Log::error('Gemini API Error', $response->json());
            return "I'm having trouble connecting to Google Gemini. Please check the API key.";

        } catch (\Exception $e) {
            Log::error('Gemini Connection Error: ' . $e->getMessage());
            return "I'm experiencing a technical glitch with the AI service.";
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
        $basePrompt = "You are a helpful, warm, and encourage support assistant for the ResortWala Vendor Panel. 
        Your goal is to help vendors set up their property, manage bookings, and grow their business. 
        Keep answers concise and actionable.";

        if ($context) {
            $basePrompt .= "\n\nCurrent Context: $context";
        }

        return $basePrompt;
    }
}
