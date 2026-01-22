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
            $template = NotificationTemplate::find($templateId);

            // --- DEBUG & EMERGENCY FIX START ---
            if ($eventName === 'otp.sms') {
                // User Requested Format:
                // Dear User, {var} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala
                $correctContent = "Dear User, {{otp}} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
                
                Log::info("NotificationEngine: OTP SMS Debug", [
                    'TemplateID' => $templateId,
                    'DB_Content' => $template ? $template->content : 'NULL',
                    'Failing_Content_Was' => $template && trim($template->content) !== trim($correctContent) ? $template->content : 'SAME'
                ]);

                // Force correct content in memory
                if ($template) {
                     $template->content = $correctContent;
                }
            }
            // --- DEBUG & EMERGENCY FIX END ---

            if (!$template || !$template->is_active) return;

            $content = $this->resolveVariables($template->content, $data);
            
            // Normalize mobile
            $mobile = preg_replace('/\D/', '', $mobile);
            if (strlen($mobile) === 10) $mobile = '91' . $mobile;

            // SMS API Integration (alldigitalgrowth.in)
            // HARDCODED API KEY from server .env (Verified)
            $apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY') ?? '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
            
            $username = config('services.sms.username') ?? env('SMS_USERNAME') ?? 'Resortwala';
            $senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
            $dltEntityId = '1701176830756233450'; // User Provided Entity ID (Matches Dear User Template)
            
            // Fetch DLT Template ID if exists for this notification template
            $dltTemplateId = '';
            
            // Normalize content for DLT lookup: Replace {{variable}} with {#var#}
            // This ensures "Dear User, {{otp}}..." matches "Dear User, {#var#}..."
            $normalizedContent = preg_replace('/\{\{[^}]+\}\}/', '{#var#}', $template->content);
            
            // Use 15 chars prefix of NORMALIZED content
            $search = substr($normalizedContent, 0, 15);
            
            $dltRegistry = DltRegistry::where('sender_id', $senderId)
                ->where('approved_content', 'LIKE', $search . '%')
                ->first();
                
            if ($dltRegistry) {
                $dltTemplateId = $dltRegistry->template_id;
            } else {
                Log::warning("NotificationEngine: DLT Template Not Found for '{$template->name}' using search '{$search}%'");
            }

            $response = Http::get('http://sms.alldigitalgrowth.in/v2/sendSMS', [
                'username' => $username,
                'message' => $content,
                'sendername' => $senderId,
                'smstype' => 'TRANS',
                'numbers' => $mobile,
                'apikey' => $apiKey,
                'templateid' => $dltTemplateId,
                'peid' => $dltEntityId
            ]);
            // http://sms.alldigitalgrowth.in/v2/sendSMS?username=...
            Log::info("NotificationEngine: SMS Response", ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                // Check for logical error in body (e.g. INVALID_USER)
                if (stripos($response->body(), 'INVALID') !== false || stripos($response->body(), 'ERROR') !== false) {
                     Log::error("NotificationEngine: SMS Logical Failure: " . $response->body());
                     $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'failed', $response->body());
                } else {
                     Log::info("NotificationEngine: SMS Sent Successfully to {$mobile}");
                     $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'sent');
                }
            } else {
                Log::error("NotificationEngine: SMS HTTP Failure: " . $response->status());
                $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'failed', $response->body());
            }

        } catch (\Exception $e) {
            $this->log('sms', $mobile, null, $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage());
            Log::error("NotificationEngine: SMS Exception - " . $e->getMessage());
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
