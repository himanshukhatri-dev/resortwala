<?php

namespace App\Services\WhatsApp;

use App\Models\EmailLog;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function send(WhatsAppMessage $message)
    {
        // 1. Prepare Payload
        $payload = [
            'to' => $message->recipient,
            'content' => $message->content,
            'template' => $message->templateName,
            'variables' => $message->variables
        ];

        // 2. Simulate Sending (Log to file)
        Log::channel('daily')->info("WhatsApp Simulation: To: {$message->recipient} | Msg: " . ($message->templateName ?? $message->content));
        
        // TODO: Integrate actual Provider (Twilio / Interakt / Gupshup) here
        // $success = Http::post('...', $payload)->successful();
        $success = true; // Simulation success

        // 3. Log to DB (Unified Communication Log)
        try {
            EmailLog::create([
                'channel' => 'whatsapp',
                'recipient' => $message->recipient,
                'subject' => $message->templateName ? "Template: {$message->templateName}" : substr($message->content, 0, 50) . '...',
                'status' => $success ? 'sent' : 'failed',
                'template_name' => $message->templateName ?? 'manual_text',
                'payload' => $payload
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log WhatsApp message: " . $e->getMessage());
        }

        return $success;
    }
}
