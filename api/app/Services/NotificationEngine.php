<?php

namespace App\Services;

use App\Models\NotificationTrigger;
use App\Models\NotificationTemplate;
use App\Models\NotificationLog;
use App\Models\DltRegistry;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;

class NotificationEngine
{
    /**
     * Dispatch a system event to relevant channels.
     * 
     * @param string $eventName - e.g., 'booking.confirmed'
     * @param mixed $recipient - User model or Object with email/mobile
     * @param array $data - Data for variable replacement (e.g., booking details)
     */
    public function dispatch($eventName, $recipient, $data = [])
    {
        Log::info("NotificationEngine: Dispatching event '{$eventName}'");

        // 1. Find Trigger
        $trigger = NotificationTrigger::where('event_name', $eventName)
            ->where('is_active', true)
            ->first();

        if (!$trigger) {
            Log::warning("NotificationEngine: No active trigger found for '{$eventName}'");
            return false;
        }

        // 2. Resolve Recipient Info
        $contact = $this->resolveContact($recipient);
        if (!$contact) {
            Log::error("NotificationEngine: Could not resolve contact info for recipient.");
            return false;
        }

        // 3. Process Channels
        
        // Email
        if ($trigger->email_template_id && !empty($contact['email'])) {
            $this->sendEmail($trigger->email_template_id, $contact['email'], $data, $eventName);
        }

        // SMS
        if ($trigger->sms_template_id && !empty($contact['mobile'])) {
            $this->sendSMS($trigger->sms_template_id, $contact['mobile'], $data, $eventName);
        }

        // WhatsApp
        if ($trigger->whatsapp_template_id && !empty($contact['mobile'])) {
            $this->sendWhatsApp($trigger->whatsapp_template_id, $contact['mobile'], $data, $eventName);
        }

        return true;
    }

    /**
     * Process Email Sending
     */
    protected function sendEmail($templateId, $email, $data, $eventName)
    {
        try {
            $template = NotificationTemplate::find($templateId);
            if (!$template || !$template->is_active) return;

            // Resolve Content
            $subject = $this->resolveVariables($template->subject, $data);
            $content = $this->resolveVariables($template->content, $data);

            // Send via Mail Facade (using a generic Mailable or Raw)
            // Using raw for full HTML control configured in template
            Mail::html($content, function ($message) use ($email, $subject) {
                $message->to($email)
                        ->subject($subject);
            });

            $this->log('email', $email, $subject, $content, $template->name, $eventName, 'sent');

        } catch (\Exception $e) {
            $this->log('email', $email, $template->subject ?? 'Error', $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage());
            Log::error("NotificationEngine: Email Failed - " . $e->getMessage());
        }
    }

    /**
     * Process SMS Sending (DLT Compliant)
     */
    protected function sendSMS($templateId, $mobile, $data, $eventName)
    {
        try {
            // SMS Templates in notification_templates are just containers/labels
            // The actual content is enforced by DLT Registry if we are strict.
            // Or, we store the content in `notification_templates` but validate against DLT.
            
            $template = NotificationTemplate::find($templateId);
            if (!$template || !$template->is_active) return;

            // Find DLT mapping if strict mode
            // For now, we assume the content in template is the DLT content.
            
            $content = $this->resolveVariables($template->content, $data);

            // TODO: Integrate actual SMS Provider (MSG91/Twilio)
            // Http::post(...)
            
            // Mock Success
            Log::info("NotificationEngine: SMS Mock Send to {$mobile}: {$content}");

            $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'sent');

        } catch (\Exception $e) {
            $this->log('sms', $mobile, null, $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage());
        }
    }

    /**
     * Process WhatsApp Sending
     */
    protected function sendWhatsApp($templateId, $mobile, $data, $eventName)
    {
        try {
            $template = NotificationTemplate::find($templateId);
            if (!$template || !$template->is_active) return;

            $content = $this->resolveVariables($template->content, $data);

            // TODO: WhatsApp API Call
            Log::info("NotificationEngine: WhatsApp Mock Send to {$mobile}: {$content}");

            $this->log('whatsapp', $mobile, null, $content, $template->name, $eventName, 'sent');

        } catch (\Exception $e) {
            $this->log('whatsapp', $mobile, null, $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage());
        }
    }

    /**
     * Helper: Resolve Variables {{var}}
     */
    protected function resolveVariables($content, $data)
    {
        if (empty($content)) return '';

        foreach ($data as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $content = str_replace("{{" . $key . "}}", $value, $content);
                // Also support space tolerant {{ var }}
                $content = str_replace("{{ " . $key . " }}", $value, $content);
            }
        }
        
        return $content;
    }

    /**
     * Helper: Resolve Contact Info
     */
    protected function resolveContact($recipient)
    {
        if (is_array($recipient)) {
            return [
                'email' => $recipient['email'] ?? null,
                'mobile' => $recipient['mobile'] ?? null
            ];
        }

        if ($recipient instanceof User || $recipient instanceof \App\Models\Customer) {
            return [
                'email' => $recipient->email ?? $recipient->CustomerEmail ?? null,
                'mobile' => $recipient->mobile ?? $recipient->phone ?? $recipient->CustomerMobile ?? null
            ];
        }

        // Fallback for object with email property
        return [
            'email' => $recipient->email ?? null,
            'mobile' => $recipient->mobile ?? null
        ];
    }

    /**
     * Helper: Log to DB
     */
    protected function log($channel, $recipient, $subject, $content, $tplName, $evtName, $status, $error = null)
    {
        NotificationLog::create([
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'content' => $content,
            'template_name' => $tplName,
            'event_name' => $evtName,
            'status' => $status,
            'error_message' => $error,
            'created_by' => auth()->id() ?? 0 // 0 for system
        ]);
    }
}
