<?php

require __DIR__ . '/vendor/autoload.php';
use Illuminate\Support\Facades\Http;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DEEP SMS DEBUG ---\n";

$mobile = '9870646548'; // Verified number
$mobile = '91' . $mobile; // Add prefix manual

$username = config('services.sms.username') ?? env('SMS_USERNAME') ?? 'Resortwala';
$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$dltEntityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');

// Known valid template
// ID: 1707176886644052410
// Content: Dear User, {#var#} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala
$templateId = '1707176886644052410';
$content = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";

// Fetch correct Sender ID
$dlt = \App\Models\DltRegistry::where('template_id', $templateId)->first();
$dbSenderId = $dlt ? $dlt->sender_id : 'UNKNOWN';
echo "DB Sender ID: $dbSenderId\n";
echo "Config Sender ID: $senderId\n";

// Use DB Sender ID if available
if ($dlt) $queryParams['sendername'] = $dbSenderId;

// Test 1: Route=4 (Transactional)
echo "\n[Test 1] Route=4 (Transactional)\n";
$queryParams['route'] = 4;
$url = 'http://sms.alldigitalgrowth.in/sendSMS?' . http_build_query($queryParams);
echo "URL: $url\n";
echo "Response: " . Http::get($url)->body() . "\n";

// Test 2: Route=6 (Service Implicit - OTP)
echo "\n[Test 2] Route=6 (Service Implicit)\n";
$queryParams['route'] = 6;
$url = 'http://sms.alldigitalgrowth.in/sendSMS?' . http_build_query($queryParams);
echo "URL: $url\n";
echo "Response: " . Http::get($url)->body() . "\n";

// Test 3: No Entity ID (Check if optional)
echo "\n[Test 3] No Entity ID\n";
unset($queryParams['entityid']);
$url = 'http://sms.alldigitalgrowth.in/sendSMS?' . http_build_query($queryParams);
echo "URL: $url\n";
echo "Response: " . Http::get($url)->body() . "\n";
