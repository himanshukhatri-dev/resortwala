<?php

namespace App\Services;

use App\Models\AIChatConversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAssistantService
{
    private $apiKey;
    private $endpoint = 'https://api.openai.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
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

        $apiMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            array_slice($messages, -10) // Limit context window
        );

        // 4. Call OpenAI API (Simulated if no key)
        if (!$this->apiKey) {
            $botResponse = "I'm a simulated AI assistant. I see you asked: '$message'. Please configure the OpenAI API key to get real responses.";
        } else {
            try {
                $response = Http::withToken($this->apiKey)->post($this->endpoint, [
                    'model' => 'gpt-4',
                    'messages' => $apiMessages,
                    'temperature' => 0.7,
                ]);

                if ($response->successful()) {
                    $botResponse = $response->json('choices.0.message.content');
                } else {
                    Log::error('OpenAI API Error', $response->json());
                    $botResponse = "I'm having trouble connecting to my brain right now. Please try again later.";
                }
            } catch (\Exception $e) {
                Log::error('OpenAI Connection Error: ' . $e->getMessage());
                $botResponse = "I'm experiencing a temporary glitch. Please try again.";
            }
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
