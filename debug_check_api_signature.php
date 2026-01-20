<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS API Signature ---\n";

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY'); // Might be password
$username = config('services.sms.username') ?? 'Resortwala';
$senderId = 'ResWla';
$mobile = '919870646548'; 
$message = "Test SMS";

// Signature 1: Current
// username, apikey, sendername, smstype, numbers, message
$sig1 = [
    'username' => $username,
    'apikey' => $apiKey,
    'sendername' => $senderId,
    'numbers' => $mobile,
    'message' => $message
];

// Signature 2: Common Alternative (user, password/key)
// user, password, senderid, mobiles, text
$sig2 = [
    'user' => $username,
    'password' => $apiKey, // Try key as password
    'senderid' => $senderId,
    'mobiles' => $mobile,
    'text' => $message,
    'route' => '4' // Common route ID
];

// Signature 3: Another common one (authkey)
// authkey, sender, mobiles, message
$sig3 = [
    'authkey' => $apiKey,
    'sender' => $senderId,
    'mobiles' => $mobile,
    'message' => $message
];

$sigs = ['Original' => $sig1, 'Alt 1 (user/pwd)' => $sig2, 'Alt 2 (authkey)' => $sig3];

foreach ($sigs as $name => $data) {
    echo "\nTesting: $name ...\n";
    $response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $data); // Try root or sendSMS?
    // Try sendSMS first
    if ($response->status() != 404) {
        echo "Endpoint /sendSMS Status: " . $response->status() . " Body: " . substr($response->body(), 0, 100) . "\n";
    }

    // Try alternate endpoint if 400
    if ($response->status() == 400 || $response->status() == 404) {
        $response2 = Http::get('http://sms.alldigitalgrowth.in/api/sendhttp.php', $data); // legacy style
        if ($response2->status() != 404) {
            echo "Endpoint /api/sendhttp.php Status: " . $response2->status() . " Body: " . substr($response2->body(), 0, 100) . "\n";
        }
    }
}
