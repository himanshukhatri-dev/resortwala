<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSent;
use App\Models\EmailLog;
use Illuminate\Support\Str;

class LogSentMessage
{
    public function handle(MessageSent $event)
    {
        try {
            $message = $event->message;
            
            // Extract Recipient
            $to = collect($message->getTo())->map(function ($address) {
                return $address->getAddress();
            })->implode(', ');

            // Extract Subject
            $subject = $message->getSubject();

            // Try to guess template name from standard headers or context if available
            // Note: Laravel doesn't easily expose the view name in the MessageSent event without custom headers.
            // For now, we logging generic info.
            
            EmailLog::create([
                'recipient' =>Str::limit($to, 255),
                'subject' => Str::limit($subject, 255),
                'status' => 'sent',
                'template_name' => 'N/A', // Placeholder unless we add custom headers
                'payload' => []
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to log email: ' . $e->getMessage());
        }
    }
}
