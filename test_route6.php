<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Testing Route 6 Delivery (Env Config) ---\n";

$apiKeyEnv = env('SMS_API_KEY');
$usernameEnv = env('SMS_USERNAME');
$entityIdEnv = env('SMS_DLT_ENTITY_ID');

echo "Env API Key (len): " . strlen($apiKeyEnv) . "\n";
echo "Env Username: $usernameEnv\n";
echo "Env Entity: $entityIdEnv\n";

// Load from Config (which loads from Env)
$apiKey = config('services.sms.api_key');
$username = config('services.sms.username');
$senderId = config('services.sms.sender_id');
$entityId = config('services.sms.dlt_entity_id');

echo "Config Username: $username\n";
echo "Config Entity: $entityId\n";

if (!$apiKey) die("ERROR: API Key Config Missing.\n");
if (!$username) die("ERROR: Username Config Missing.\n");
if (!$entityId) die("ERROR: Entity ID Config Missing.\n");

$mobile = '919870646548'; 
$message = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$templateId = '1707176886644052410'; 
$route = '6';

$params = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS', // Or 'OTP'? Usually TRANS + Route 6 implies Service Implicit
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'entityid' => $entityId,
    'route' => $route
];

echo "Sending to $mobile via Route $route...\n";

$response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params);

echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
