<?php

use App\Models\NotificationTemplate;
use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Generating Debug URL ---\n";

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? env('SMS_USERNAME') ?? 'Resortwala';
$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
$entityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');

$mobile = '919870646548'; 

// Use the OTP Template for testing as it's short content
$tplName = 'sms_auth_otp';
$template = NotificationTemplate::where('name', $tplName)->first();

if (!$template) die("Template '$tplName' not found.\n");

// Resolve content with '123456'
$content = $template->content;
$content = str_replace("{{otp}}", '123456', $content);
$content = str_replace("{{ otp }}", '123456', $content);

// Get Mapped Registry
$search = substr($template->content, 0, 15);
$registry = \App\Models\DltRegistry::where('sender_id', $senderId)
    ->where('approved_content', 'LIKE', $search . '%')
    ->first();
$dltTemplateId = $registry ? $registry->template_id : '1707176886644052410'; // Fallback to provided ID

$params = [
    'username' => $username,
    'message' => $content,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile, // Engine does this normalization
    'apikey' => $apiKey,
    'templateid' => $dltTemplateId,
    'entityid' => $entityId, 
    'route' => '4'
];

$queryString = http_build_query($params);
$url = "http://sms.alldigitalgrowth.in/sendSMS?" . $queryString;

echo "\nPaste this URL in your browser to test exact system parameters:\n";
echo $url . "\n\n";

// Also verify what happens if we call it from here
echo "Calling URL from script...\n";
$response = Http::get($url);
echo "Status: " . $response->status() . " Body: " . $response->body() . "\n";
