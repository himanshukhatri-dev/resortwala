<?php

$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$mobile = '919833633800'; // Default test number from env
$message = 'Test SMS from ResortWala Debugger ' . date('H:i:s');
$templateId = '1707173874136934440'; // Sample OTP Template ID or similar
$peId = '1701176830756233450';

echo "Testing SMS to $mobile...\n";

$url = "http://sms.alldigitalgrowth.in/v2/sendSMS?" . http_build_query([
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'peid' => $peId
]);

echo "Request URL: $url\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo "Response: $response\n";

if (strpos($response, 'INVALID') !== false || strpos($response, 'ERROR') !== false) {
    echo "FAILED.\n";
} else {
    echo "SUCCESS (Likely).\n";
}
