<?php
// debug_sms_simple.php
echo "--- START SMS SIMPLE DEBUG ---\n";

// 1. Manually Load .env
$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    die("Error: .env not found at $envPath\n");
}

$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $env[trim($parts[0])] = trim($parts[1], " \t\n\r\0\x0B\"'");
    }
}

$mobile = '919011559897'; 
$username = 'Resortwala'; // Hardcoded test
$senderId = $env['SMS_SENDER_ID'] ?? 'ResWla';
$apiKey   = $env['SMS_API_KEY'] ?? '';
$dltEntityId = '1001569562865275631'; 
$templateId  = '1007469695624158431'; 
$otp = '123456';
$message = "Your ResortWala verification code is: {$otp}. Valid for 10 minutes.";

echo "Config:\n";
echo "  User: $username\n";
echo "  Sender: $senderId\n";
echo "  EntityID: $dltEntityId\n";
echo "  TemplateID: $templateId\n";

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
echo "Request URL (Masked): " . str_replace($apiKey, '***', $url) . "\n";

// Execute
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "--- RESPONSE ---\n";
echo "HTTP Code: $httpCode\n";
echo "Body: $output\n";
echo "--- END ---\n";
