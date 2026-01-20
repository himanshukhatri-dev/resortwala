<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS Param Names ---\n";

$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$mobile = '919870646548'; 

// VALID CONTENT for Template ID 1707176886673745125
// "Security Alert: New login to your ResortWala Admin account from {#var#} at {#var#}. - ResortWala"
$message = "Security Alert: New login to your ResortWala Admin account from 127.0.0.1 at 12:00 PM. - ResortWala";
$templateId = '1707176886673745125';
$entityId = '1701176830756233450';

$baseParams = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
];

// Test 1: entityid
echo "1. Testing 'entityid'...\n";
$params1 = array_merge($baseParams, ['entityid' => $entityId]); // Try 'entityid'
$response1 = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params1);
echo "Status: " . $response1->status() . " Body: " . $response1->body() . "\n";

// Test 2: dltentityid
echo "\n2. Testing 'dltentityid'...\n";
$params2 = array_merge($baseParams, ['dltentityid' => $entityId]); // Try 'dltentityid'
$response2 = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params2);
echo "Status: " . $response2->status() . " Body: " . $response2->body() . "\n";
