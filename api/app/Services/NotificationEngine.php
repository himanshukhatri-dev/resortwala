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
    public function dispatch($eventName, $recipient, $data = [], $forceSync = false)
    {
        // If not forced sync and async is allowed, queue the job
        if (!$forceSync && config('queue.default') !== 'sync') {
            \App\Jobs\SendNotificationJob::dispatch($eventName, $recipient, $data);
            Log::info("NotificationEngine: Queued event '{$eventName}' for background processing");
            return true;
        }

        Log::info("NotificationEngine: Dispatching event '{$eventName}' (Sync)");

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

        // --- TEST MODE REDIRECTION ---
        if (config('notification.test_mode', env('NOTIFICATION_TEST_MODE', false))) {
            $testEmail = config('notification.test_email', env('NOTIFICATION_TEST_EMAIL'));
            $testPhone = config('notification.test_phone', env('NOTIFICATION_TEST_PHONE'));

            Log::info("NotificationEngine: TEST MODE ACTIVE. Redirecting from " . ($contact['email'] ?? 'N/A') . " to {$testEmail}");

            $contact['email'] = $testEmail;
            $contact['mobile'] = $testPhone;
            $data['is_test'] = true; // Inject flag for templates
        }

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
    public function sendEmail($templateId, $email, $data, $eventName)
    {
        $startTime = microtime(true);
        try {
            $template = NotificationTemplate::find($templateId);
            if (!$template || !$template->is_active)
                return;

            // Resolve Content
            $subject = $this->resolveVariables($template->subject, $data);
            $content = $this->resolveVariables($template->content, $data);

            if (!empty($data['is_test'])) {
                $subject = "[TEST] " . $subject;
            }

            // Send via Mail Facade
            Mail::html($content, function ($message) use ($email, $subject) {
                $message->to($email)
                    ->subject($subject);
            });

            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->log('email', $email, $subject, $content, $template->name, $eventName, 'sent', null, $latency);

        } catch (\Exception $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->log('email', $email, $template->subject ?? 'Error', $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage(), $latency);
            Log::error("NotificationEngine: Email Failed - " . $e->getMessage());
        }
    }

    /**
     * Process SMS Sending (DLT Compliant)
     */
    public function sendSMS($templateId, $mobile, $data, $eventName)
    {
        $startTime = microtime(true);
        try {
            $template = NotificationTemplate::find($templateId);

            // --- DEBUG & EMERGENCY FIX START ---
            if ($eventName === 'otp.sms') {
                $correctContent = "Dear User, {{otp}} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
                if ($template) {
                    $template->content = $correctContent;
                }
            }
            // --- DEBUG & EMERGENCY FIX END ---

            if (!$template || !$template->is_active)
                return;

            $content = $this->resolveVariables($template->content, $data);

            if (!empty($data['is_test'])) {
                $content = "[TEST] " . $content;
            }

            // Normalize mobile
            $mobile = preg_replace('/\D/', '', $mobile);
            if (strlen($mobile) === 10)
                $mobile = '91' . $mobile;

            // DLT Lookup
            $senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
            $normalizedContent = preg_replace('/\{\{[^}]+\}\}/', '{#var#}', $template->content);
            $search = substr($normalizedContent, 0, 15);

            $dltRegistry = DltRegistry::where('sender_id', $senderId)
                ->where('approved_content', 'LIKE', $search . '%')
                ->first();

            $dltTemplateId = $dltRegistry ? $dltRegistry->template_id : '';

            // Retry logic (3 attempts)
            $success = false;
            $attempts = 0;
            $lastBody = '';

            while ($attempts < 3 && !$success) {
                $attempts++;
                $response = $this->dispatchSMS($mobile, $content, $dltTemplateId);

                $success = $response['success'];
                $lastBody = $response['body'];

                if (!$success && $attempts < 3) {
                    Log::warning("NotificationEngine: SMS Attempt {$attempts} failed, retrying...", ['body' => $lastBody]);
                    sleep(1);
                }
            }

            $latency = (int) ((microtime(true) - $startTime) * 1000);
            if ($success) {
                Log::info("NotificationEngine: SMS Sent Successfully to {$mobile} after {$attempts} attempts");
                $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'sent', null, $latency, $lastBody);
            } else {
                Log::error("NotificationEngine: SMS Failed after 3 attempts: " . $lastBody);
                $this->log('sms', $mobile, null, $content, $template->name, $eventName, 'failed', $lastBody, $latency);
            }

        } catch (\Exception $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->log('sms', $mobile, null, $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage(), $latency);
            Log::error("NotificationEngine: SMS Exception - " . $e->getMessage());
        }
    }

    /**
     * Helper: Raw SMS Dispatch
     */
    protected function dispatchSMS($mobile, $content, $dltId)
    {
        $apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY') ?? '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
        $username = config('services.sms.username') ?? env('SMS_USERNAME') ?? 'Resortwala';
        $senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
        $dltEntityId = '1701176830756233450';

        try {
            $response = Http::get('http://sms.alldigitalgrowth.in/v2/sendSMS', [
                'username' => $username,
                'message' => $content,
                'sendername' => $senderId,
                'smstype' => 'TRANS',
                'numbers' => $mobile,
                'apikey' => $apiKey,
                'templateid' => $dltId,
                'peid' => $dltEntityId
            ]);

            $body = $response->body();
            $success = $response->successful() &&
                stripos($body, 'INVALID') === false &&
                stripos($body, 'ERROR') === false;

            return ['success' => $success, 'body' => $body];

        } catch (\Exception $e) {
            return ['success' => false, 'body' => $e->getMessage()];
        }
    }

    /**
     * Process WhatsApp Sending
     */
    public function sendWhatsApp($templateId, $mobile, $data, $eventName)
    {
        $startTime = microtime(true);
        try {
            $template = NotificationTemplate::find($templateId);
            if (!$template || !$template->is_active)
                return;

            $content = $this->resolveVariables($template->content, $data);

            if (!empty($data['is_test'])) {
                $content = "[TEST] " . $content;
            }

            // Real WhatsApp Sending
            $whatsAppService = new \App\Services\WhatsApp\WhatsAppService();
            $variables = array_values($data);

            $message = new \App\Services\WhatsApp\WhatsAppMessage(
                $mobile,
                $content,
                $template->name,
                $variables
            );

            // Retry logic for WhatsApp (3 attempts)
            $success = false;
            $attempts = 0;
            $lastResult = null;

            while ($attempts < 3 && !$success) {
                $attempts++;
                $lastResult = $whatsAppService->send($message);
                $success = $lastResult['success'];
                if (!$success && $attempts < 3)
                    sleep(2);
            }

            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->log(
                'whatsapp',
                $mobile,
                null,
                $content,
                $template->name,
                $eventName,
                $success ? 'sent' : 'failed',
                $success ? null : ($lastResult['body'] ?? 'Unknown Error'),
                $latency,
                $lastResult['provider_id'] ?? null
            );

        } catch (\Exception $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->log('whatsapp', $mobile, null, $e->getMessage(), $template->name ?? 'Unknown', $eventName, 'failed', $e->getMessage(), $latency);
            Log::error("NotificationEngine: WhatsApp Exception - " . $e->getMessage());
        }
    }

    /**
     * Helper: Resolve Variables {{var}} and {#var#}
     */
    protected function resolveVariables($content, $data)
    {
        if (empty($content))
            return '';

        foreach ($data as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                // Support {{key}}, {{ key }}, and {#key#}
                $patterns = [
                    "{{" . $key . "}}",
                    "{{ " . $key . " }}",
                    "{#" . $key . "#}"
                ];
                $content = str_replace($patterns, $value, $content);
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
    public function log($channel, $recipient, $subject, $content, $tplName, $evtName, $status, $error = null, $latency = null, $providerId = null)
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
            'latency_ms' => $latency,
            'provider_id' => $providerId,
            'created_by' => auth()->id() ?? 0 // 0 for system
        ]);
    }
}
