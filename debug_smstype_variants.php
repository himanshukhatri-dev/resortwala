<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS Type Variants ---\n";

$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$mobile = '919870646548'; 

// Valid Content (Admin Alert)
$message = "Security Alert: New login to your ResortWala Admin account from 127.0.0.1 at 12:00 PM. - ResortWala";
$templateId = '1707176886673745125';
$entityId = '1701176830756233450';

$baseParams = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'entityid' => $entityId // We confirmed 'entityid' is accepted by API schema
];

$types = ['TRANS', 'SI', 'Service Implicit', 'OTP', 'CNT'];

foreach ($types as $type) {
    echo "Testing smstype='$type' ... ";
    
    $params = array_merge($baseParams, ['smstype' => $type]);
    
    // Add unique timestamp to message to avoid deduping at provider end if possible?
    // Changing message breaks DLT. So keep identical.
    
    $response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params);
    echo "Status: " . $response->status() . " Body: " . substr($response->body(), 0, 100) . "\n";
}
