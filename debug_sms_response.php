<?php

use App\Services\NotificationEngine;
use App\Models\NotificationTemplate;
use App\Models\DltRegistry;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS Delivery ---\n";

$mobile = '919870646548'; // User's number
$tplName = 'sms_admin_login_alert';

$template = NotificationTemplate::where('name', $tplName)->first();
if (!$template) die("Template not found!\n");

$data = [
    'ip' => '127.0.0.1',
    'time' => date('d-M H:i A')
];

$engine = new NotificationEngine();

// 1. Resolve Content
// Reflection to access protected method or just duplicate logic for debug
$content = $template->content;
foreach ($data as $key => $value) {
    // $content = str_replace("{{" . $key . "}}", $value, $content);
    // Use the engine's exact logic if possible, or simplified:
    $content = str_replace("{{{$key}}}", $value, $content); 
    $content = str_replace("{{ {$key} }}", $value, $content); 
}
echo "Resolved Content: $content\n";

// 2. Resolve DLT
$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
echo "Sender ID: $senderId\n";

// Check DB content for matching
// In NotificationEngine: substr($template->content, 0, 10)
// Actual content starts with "Security Alert: New login..."
// DLT content starts with "Security Alert: New login..."
// This should match. Let's dump the exact strings.

$search = substr($template->content, 0, 15);
echo "DLT Search string (First 15 chars): '$search'\n";

// Try broader search
$dltRegistry = DltRegistry::where('sender_id', $senderId)
    ->where('approved_content', 'LIKE', $search . '%') // Starts with
    ->first();

if (!$dltRegistry) {
    // Fallback search by template ID directly if we know it (debug only)
    $dltRegistry = DltRegistry::where('template_id', '1707176886673745125')->first();
    if ($dltRegistry) echo "FOUND via ID fallback!\n";
}

$dltTemplateId = $dltRegistry ? $dltRegistry->template_id : 'NOT FOUND';
echo "Resolved DLT Template ID: $dltTemplateId\n";

if (!$dltRegistry) {
    echo "WARNING: DLT Registry not found for this template!\n";
    // Debug: List all registries
    echo "Existing Registries:\n";
    $all = DltRegistry::all();
    foreach($all as $r) {
        echo "- Sender: {$r->sender_id}, TplID: {$r->template_id}, Content: " . substr($r->approved_content, 0, 20) . "...\n";
    }
}

// 3. Make Request (simulating Engine)
$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? 'Resortwala';
$dltEntityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');

echo "Entity ID: $dltEntityId\n";

$params = [
    'username' => $username,
    'message' => $content,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $dltTemplateId,
    'dltentityid' => $dltEntityId
];

echo "Request Params: " . print_r($params, true) . "\n";

echo "Sending Request...\n";
$response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params);

echo "Response Status: " . $response->status() . "\n";
echo "Response Body: " . $response->body() . "\n";
