<?php

use App\Services\NotificationEngine;
use App\Models\NotificationTemplate;
use App\Models\DltRegistry;
use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$logFile = 'sms_full_debug_log.txt';
$fp = fopen($logFile, 'w');

function debug($msg) {
    global $fp;
    echo $msg . "\n";
    fwrite($fp, $msg . "\n");
}

debug("--- Debugging SMS Delivery (Full Log) ---");

$mobile = '919870646548'; 
$tplName = 'sms_admin_login_alert';

$template = NotificationTemplate::where('name', $tplName)->first();
if (!$template) debug("Template not found!");

$data = ['ip' => '127.0.0.1', 'time' => date('d-M H:i A')];

// Manual resolution
$content = $template->content;
foreach ($data as $key => $value) {
    $content = str_replace("{{{$key}}}", $value, $content); 
    $content = str_replace("{{ {$key} }}", $value, $content); 
}
debug("Content: $content");

// DLT Lookup
$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
debug("SenderID: $senderId");

$search = substr($template->content, 0, 10);
$dltRegistry = DltRegistry::where('sender_id', $senderId)->where('approved_content', 'LIKE', '%' . $search . '%')->first();
$dltTemplateId = $dltRegistry ? $dltRegistry->template_id : 'NOT FOUND';
debug("DLT ID: $dltTemplateId");

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? 'Resortwala';
$dltEntityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');

$queryParams = http_build_query([
    'username' => $username,
    'message' => $content,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $dltTemplateId,
    'dltentityid' => $dltEntityId
]);

$url = "http://sms.alldigitalgrowth.in/sendSMS?" . $queryParams;
debug("Full Request URL: $url");

$response = Http::get($url);

debug("Response Status: " . $response->status());
debug("Response Body: " . $response->body());

fclose($fp);
echo "Log written to $logFile\n";
