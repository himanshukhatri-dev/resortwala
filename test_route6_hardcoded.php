<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Testing Route 6 Delivery (Hardcoded) ---\n";

$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$entityId = '1701176830756233450';
$mobile = '919870646548'; 

// EXACT OTP CONTENT
// "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala"
$message = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$templateId = '1707176886644052410'; 
$route = '6';

$params = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
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
