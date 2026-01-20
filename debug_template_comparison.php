<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging Template Comparison ---\n";

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? 'Resortwala';
$senderId = 'ResWla';
$entityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');
$mobile = '919870646548'; 

// 1. ADMIN ALERT (Known Good Content?)
$adminMsg = "Security Alert: New login to your ResortWala Admin account from 127.0.0.1 at 12:00 PM. - ResortWala";
$adminTplId = '1707176886673745125';

// 2. OTP (Suspected Bad)
$otpMsg = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$otpTplId = '1707176886644052410';

$baseParams = [
    'username' => $username,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'entityid' => $entityId, 
    'route' => '4'
];

echo "1. Testing ADMIN ALERT...\n";
$p1 = array_merge($baseParams, ['message' => $adminMsg, 'templateid' => $adminTplId]);
$r1 = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $p1);
echo "Status: " . $r1->status() . " Body: " . substr($r1->body(), 0, 100) . "\n";


echo "\n2. Testing OTP...\n";
$p2 = array_merge($baseParams, ['message' => $otpMsg, 'templateid' => $otpTplId]);
$r2 = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $p2);
echo "Status: " . $r2->status() . " Body: " . substr($r2->body(), 0, 100) . "\n";
