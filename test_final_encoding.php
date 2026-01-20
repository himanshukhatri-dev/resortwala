<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Testing Final Encoding Fix ---\n";

// Config matches production
$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$entityId = '1701176830756233450';
$mobile = '919870646548'; 
$message = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$templateId = '1707176886644052410'; 
$route = '6';

echo "Building Query with PHP_QUERY_RFC3986 (Forces %20)...\n";

$queryParams = http_build_query([
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'entityid' => $entityId, 
    // 'route' => '4' // REMOVED as per user request/latest config
], '', '&', PHP_QUERY_RFC3986);

$url = 'http://sms.alldigitalgrowth.in/sendSMS?' . $queryParams;
echo "Generated URL Start: " . substr($url, 0, 100) . "...\n";

// Verify space encoding
if (strpos($url, '%20') !== false) {
    echo "Check: Spaces are correctly encoded as %20\n";
} else {
    echo "Check: Spaces are NOT encoded as %20 (FAIL)\n";
}

echo "Sending Request via Http::get...\n";
$response = Http::get($url);

echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
