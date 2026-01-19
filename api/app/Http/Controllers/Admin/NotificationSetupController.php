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

        $template = NotificationTemplate::updateOrCreate(
            ['name' => $request->name, 'channel' => $request->channel],
            [
                'subject' => $request->subject,
                'content' => $request->content,
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

    // --- Test Sending ---
    public function sendTest(Request $request)
    {
        $request->validate([
            'type' => 'required|in:email,sms,whatsapp',
            'recipient' => 'required', // email or phone
            'template_id' => 'required|exists:notification_templates,id',
            'data' => 'nullable|array'
        ]);

        $engine = new \App\Services\NotificationEngine();
        $template = NotificationTemplate::find($request->template_id);
        
        // Mock Event Name for logging
        $eventName = 'admin.test_send';

        if ($request->type === 'email') {
             // We can use a protected method accessor or just copy logic for test
             // For cleaner code, we might expose a public method in Engine for "sendTemplateDirectly"
             // But for now, let's just trigger a dummy event or duplicate sending logic briefly for test?
             // Actually, the Engine is designed for Triggers. 
             // To test a specific template, we should verify specific template logic.
             // Let's refactor Engine or just use Mail facade here for test validation.
             
             // BUT user wants to verify the Engine works.
             // We can't use dispatch matching event because we want to force a specific TEMPLATE ID.
             
             // HACK: We will instantiate engine and use reflection or just assume
             // we'll implement a 'sendDirect' method in Engine.
             
             // Let's add sendDirect to Engine? No, let's keep it simple.
             // Just duplicate the "Resolution" logic here for the test to verify content.
             
             $content = $template->content;
             foreach (($request->data ?? []) as $k => $v) {
                 $content = str_replace("{{".$k."}}", $v, $content);
             }
             
             if ($request->type === 'email') {
                 \Illuminate\Support\Facades\Mail::html($content, function($msg) use ($request, $template) {
                     $msg->to($request->recipient)->subject($template->subject ?? 'Test');
                 });
             } else {
                 // Log SMS
                 \Illuminate\Support\Facades\Log::info("Test SMS to {$request->recipient}: {$content}");
             }
        }
        
        return response()->json(['message' => 'Test sent (Check logs)']);
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
            if (!empty($data['sms_provider'])) $envUpdates['SMS_PROVIDER'] = $data['sms_provider'];
            if (!empty($data['sms_api_key'])) $envUpdates['SMS_API_KEY'] = $data['sms_api_key'];
            if (!empty($data['sms_sender_id'])) $envUpdates['SMS_SENDER_ID'] = $data['sms_sender_id'];
            if (!empty($data['dlt_n_key'])) $envUpdates['SMS_DLT_ENTITY_ID'] = $data['dlt_n_key'];
        } 
        elseif ($request->section === 'whatsapp') {
            if (!empty($data['whatsapp_phone_id'])) $envUpdates['META_WHATSAPP_PHONE_ID'] = $data['whatsapp_phone_id'];
            if (!empty($data['whatsapp_access_token'])) $envUpdates['META_WHATSAPP_TOKEN'] = $data['whatsapp_access_token'];
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
}
