<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS Protocol ---\n";

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? 'Resortwala';
$senderId = 'ResWla';
$mobile = '919870646548'; 
$message = "Security Alert: New login to your ResortWala Admin account from 127.0.0.1 at 20-Jan 10:11 AM. - ResortWala";
$templateId = '1707176886673745125';
$entityId = '1701176830756233450';

$params = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'dltentityid' => $entityId
];

// 1. Try HTTPS GET
echo "1. Testing HTTPS GET...\n";
try {
    $response = Http::get('https://sms.alldigitalgrowth.in/sendSMS', $params);
    echo "Status: " . $response->status() . "\n";
} catch (\Exception $e) {
    echo "HTTPS Failed: " . $e->getMessage() . "\n";
}

// 2. Try HTTP POST
echo "\n2. Testing HTTP POST...\n";
$response = Http::asForm()->post('http://sms.alldigitalgrowth.in/sendSMS', $params);
echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";

// 3. Try with NO DLT params (just to check error change)
echo "\n3. Testing HTTP GET (No DLT)...\n";
$minimalParams = $params;
unset($minimalParams['templateid']);
unset($minimalParams['dltentityid']);
$response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $minimalParams);
echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
