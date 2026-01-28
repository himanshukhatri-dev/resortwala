<?php

namespace App\Services\WhatsApp;

use App\Models\EmailLog;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function send(WhatsAppMessage $message)
    {
        $phoneId = config('services.whatsapp.phone_id') ?? env('META_WHATSAPP_PHONE_ID');
        $token = config('services.whatsapp.token') ?? env('META_WHATSAPP_TOKEN');

        if (!$phoneId || !$token) {
            Log::error("WhatsAppService: Meta Phone ID or Token missing.");
            return false;
        }

        // Normalize mobile (ensure 91 prefix for India if not present)
        $mobile = preg_replace('/\D/', '', $message->recipient);
        if (strlen($mobile) === 10)
            $mobile = '91' . $mobile;

        // Meta Cloud API Endpoint
        $url = "https://graph.facebook.com/v17.0/{$phoneId}/messages";

        // Prepare Meta Payload for Template Message
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $mobile,
            'type' => 'template',
            'template' => [
                'name' => $message->templateName,
                'language' => ['code' => 'en_US'],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => []
                    ]
                ]
            ]
        ];

        // Map variables to Meta parameters (ordered list)
        foreach (($message->variables ?? []) as $val) {
            $payload['template']['components'][0]['parameters'][] = [
                'type' => 'text',
                'text' => (string) $val
            ];
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->post($url, $payload);

            $success = $response->successful();
            $body = $response->json();
            $messageId = $body['messages'][0]['id'] ?? null;

            Log::info("WhatsAppService API Response", [
                'to' => $mobile,
                'status' => $response->status(),
                'message_id' => $messageId
            ]);

            return [
                'success' => $success,
                'provider_id' => $messageId,
                'body' => $response->body()
            ];

        } catch (\Exception $e) {
            Log::error("WhatsAppService Exception: " . $e->getMessage());
            return [
                'success' => false,
                'provider_id' => null,
                'body' => $e->getMessage()
            ];
        }
    }
}
