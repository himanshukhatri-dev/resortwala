<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NotificationTemplate;
use App\Models\DltRegistry;
use App\Models\NotificationTrigger;

class NotificationSetupController extends Controller
{
    // --- Templates ---
    public function getTemplates(Request $request)
    {
        $channel = $request->channel ?? 'email';
        $templates = NotificationTemplate::where('channel', $channel)->orderBy('name')->get();
        return response()->json($templates);
    }

    public function saveTemplate(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'channel' => 'required|in:email,sms,whatsapp',
            'content' => 'required|string',
        ]);

        if (strpos($request->content, '{{') !== false && strpos($request->content, '}}') === false) {
            return response()->json(['message' => 'Syntax Error: Unclosed variable bracket {{ found.'], 422);
        }

        // Sanitize for XSS (Allowing email-safe tags)
        $allowedTags = '<p><a><b><strong><i><em><u><br><div><span><h1><h2><h3><h4><h5><h6><ul><ol><li><table><thead><tbody><tr><th><td><img><style>';
        $safeContent = strip_tags($request->content, $allowedTags);

        $template = NotificationTemplate::updateOrCreate(
            ['name' => $request->name, 'channel' => $request->channel],
            [
                'subject' => $request->subject,
                'content' => $safeContent,
                'variables' => $request->variables ?? [],
                'is_active' => $request->is_active ?? true
            ]
        );

        return response()->json(['message' => 'Template saved', 'template' => $template]);
    }

    // --- DLT ---
    public function getDltRegistries()
    {
        return response()->json(DltRegistry::all());
    }

    public function saveDltRegistry(Request $request)
    {
        $request->validate([
            'entity_id' => 'required|string',
            'sender_id' => 'required|string|max:6',
            'template_id' => 'required|string',
            'approved_content' => 'required|string',
        ]);

        $dlt = DltRegistry::updateOrCreate(
            ['template_id' => $request->template_id],
            $request->all()
        );

        return response()->json(['message' => 'DLT Registry saved', 'data' => $dlt]);
    }

    // --- Triggers ---
    public function getTriggers()
    {
        $triggers = NotificationTrigger::with(['emailTemplate', 'smsTemplate', 'whatsappTemplate'])->get();
        return response()->json($triggers);
    }

    public function saveTrigger(Request $request)
    {
        $request->validate([
            'event_name' => 'required|string',
            'audience' => 'required|string'
        ]);

        $trigger = NotificationTrigger::updateOrCreate(
            ['event_name' => $request->event_name],
            [
                'email_template_id' => $request->email_template_id,
                'sms_template_id' => $request->sms_template_id,
                'whatsapp_template_id' => $request->whatsapp_template_id,
                'audience' => $request->audience,
                'is_active' => $request->is_active ?? true
            ]
        );

        return response()->json(['message' => 'Trigger saved', 'data' => $trigger]);
    }

    public function sendTest(Request $request)
    {
        $request->validate([
            'type' => 'required|in:email,sms,whatsapp',
            'recipient' => 'required', // email or phone
            'template_id' => 'required|exists:notification_templates,id',
            'data' => 'nullable|array'
        ]);

        $engine = new \App\Services\NotificationEngine();
        $templateId = $request->template_id;
        $recipient = $request->recipient;
        $data = $request->data ?? [];

        // Mock Event Name for logging
        $eventName = 'admin.manual_test';

        try {
            if ($request->type === 'email') {
                $engine->sendEmail($templateId, $recipient, $data, $eventName);
            } elseif ($request->type === 'sms') {
                $engine->sendSMS($templateId, $recipient, $data, $eventName);
            } elseif ($request->type === 'whatsapp') {
                $engine->sendWhatsApp($templateId, $recipient, $data, $eventName);
            }

            return response()->json([
                'success' => true,
                'message' => 'Test request dispatched through Engine. Check Notification Logs for status.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Engine failure: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Simulate a specific system event with mock data.
     */
    public function simulateEvent(Request $request)
    {
        $request->validate([
            'event_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
        ]);

        $eventName = $request->event_name;
        $recipient = [
            'email' => $request->email,
            'mobile' => $request->phone
        ];

        // 1. Generate Mock Data based on event type
        $data = $this->getMockData($eventName);

        // 2. Dispatch using Engine
        $engine = new \App\Services\NotificationEngine();
        $success = $engine->dispatch($eventName, $recipient, $data);

        return response()->json([
            'success' => $success,
            'message' => $success ? "Simulation for '{$eventName}' dispatched." : "Failed to find active trigger for '{$eventName}'.",
            'mock_data' => $data
        ]);
    }

    protected function getMockData($event)
    {
        $data = [
            'otp' => '123456',
            'userName' => 'Test User',
            'customerName' => 'Test Customer',
            'vendorName' => 'Test Vendor',
            'propertyName' => 'The Blue Lagoon Resort',
            'bookingId' => 'RW-' . rand(1000, 9999),
            'amount' => '₹5,000',
            'checkIn' => date('d M Y', strtotime('+1 day')),
            'checkOut' => date('d M Y', strtotime('+2 days')),
            'status' => 'Confirmed',
            'rejection_comment' => 'Missing document proof for the property address.'
        ];

        return $data;
    }

    // --- Gateway Settings ---
    public function saveGateway(Request $request)
    {
        $request->validate([
            'section' => 'required|in:sms,whatsapp,email',
            'config' => 'required|array'
        ]);

        $envUpdates = [];
        $data = $request->config;

        if ($request->section === 'sms') {
            if (!empty($data['sms_provider']))
                $envUpdates['SMS_PROVIDER'] = $data['sms_provider'];
            if (!empty($data['sms_api_key']))
                $envUpdates['SMS_API_KEY'] = $data['sms_api_key'];
            if (!empty($data['sms_sender_id']))
                $envUpdates['SMS_SENDER_ID'] = $data['sms_sender_id'];
            if (!empty($data['dlt_n_key']))
                $envUpdates['SMS_DLT_ENTITY_ID'] = $data['dlt_n_key'];
        } elseif ($request->section === 'whatsapp') {
            if (!empty($data['whatsapp_phone_id']))
                $envUpdates['META_WHATSAPP_PHONE_ID'] = $data['whatsapp_phone_id'];
            if (!empty($data['whatsapp_access_token']))
                $envUpdates['META_WHATSAPP_TOKEN'] = $data['whatsapp_access_token'];
        }

        $this->updateEnv($envUpdates);

        return response()->json(['message' => 'Gateway Settings Saved']);
    }

    protected function updateEnv($data)
    {
        $path = base_path('.env');
        if (file_exists($path)) {
            $content = file_get_contents($path);
            foreach ($data as $key => $value) {
                if (preg_match("/^{$key}=.*/m", $content)) {
                    $content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $content);
                } else {
                    $content .= "\n{$key}={$value}";
                }
            }
            file_put_contents($path, $content);
        }
    }

    public function getLogs()
    {
        $logs = \App\Models\NotificationLog::orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}
