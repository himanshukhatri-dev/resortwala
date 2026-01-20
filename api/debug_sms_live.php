<?php
// debug_sms_live.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "--- START SMS DEBUG ---\n";

$mobile = '919876543210'; // Replace with a real number if needed for testing, or use safe dummy
// Better: Accept from CLI arg
global $argv;
if (isset($argv[1])) {
    $mobile = $argv[1];
}

$start = microtime(true);
echo "Target Mobile: $mobile\n";

// Configuration
$username = env('SMS_USERNAME');
$senderId = env('SMS_SENDER_ID');
$apiKey   = env('SMS_API_KEY');
$dltEntityId = '1001569562865275631'; // Hardcoded from audit
$templateId  = '1007469695624158431'; // Registration OTP Template
$otp = '123456';
$message = "Your ResortWala verification code is: {$otp}. Valid for 10 minutes.";

echo "Config:\n";
echo "  User: $username\n";
echo "  Sender: $senderId\n";
echo "  EntityID: $dltEntityId\n";
echo "  TemplateID: $templateId\n";
echo "  Message: $message\n";

// Build URL
$queryParams = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'entityid' => $dltEntityId,
];

$url = 'http://sms.alldigitalgrowth.in/sendSMS?' . http_build_query($queryParams);
echo "Request URL (Masked API Key):\n" . str_replace($apiKey, '***', $url) . "\n";

// Execute
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Force IPv4 if needed
// curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

$output = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "--- RESPONSE ---\n";
echo "HTTP Code: $httpCode\n";
echo "Body: $output\n";
if ($curlError) {
    echo "Curl Error: $curlError\n";
}

echo "--- END ---\n";
