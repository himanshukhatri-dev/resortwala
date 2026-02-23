<?php

require __DIR__ . '/vendor/autoload.php';

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== PhonePe Configuration Test ===\n\n";

echo "Environment Variables:\n";
echo "PHONEPE_MERCHANT_ID: " . ($_ENV['PHONEPE_MERCHANT_ID'] ?? 'NOT SET') . "\n";
echo "PHONEPE_SALT_KEY: " . (isset($_ENV['PHONEPE_SALT_KEY']) ? substr($_ENV['PHONEPE_SALT_KEY'], 0, 10) . '...' : 'NOT SET') . "\n";
echo "PHONEPE_SALT_INDEX: " . ($_ENV['PHONEPE_SALT_INDEX'] ?? 'NOT SET') . "\n";
echo "PHONEPE_ENV: " . ($_ENV['PHONEPE_ENV'] ?? 'NOT SET') . "\n\n";

// Test payment initiation
$merchantId = $_ENV['PHONEPE_MERCHANT_ID'];
$saltKey = $_ENV['PHONEPE_SALT_KEY'];
$saltIndex = $_ENV['PHONEPE_SALT_INDEX'];

$payload = [
    'merchantId' => $merchantId,
    'merchantTransactionId' => 'TEST_' . time(),
    'merchantUserId' => 'MUID_TEST_123',
    'amount' => 10000, // 100 INR in paise
    'redirectUrl' => 'https://resortwala.com/payment/success',
    'redirectMode' => 'REDIRECT',
    'callbackUrl' => 'https://resortwala.com/api/payment/callback',
    'mobileNumber' => '9999999999',
    'paymentInstrument' => ['type' => 'PAY_PAGE']
];

$payloadBase64 = base64_encode(json_encode($payload));
$endpoint = '/pg/v1/pay';
$checksum = hash('sha256', $payloadBase64 . $endpoint . $saltKey) . '###' . $saltIndex;

echo "Test Payment Request:\n";
echo "Payload (Base64): " . substr($payloadBase64, 0, 50) . "...\n";
echo "Checksum: " . substr($checksum, 0, 20) . "...\n\n";

// Make API request
$url = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['request' => $payloadBase64]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'X-VERIFY: ' . $checksum,
    'X-MERCHANT-ID: ' . $merchantId,
    'X-CLIENT-VERSION: 1'
]);

echo "Making API Request to: $url\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Response:\n";
echo "HTTP Code: $httpCode\n";
if ($error) {
    echo "cURL Error: $error\n";
}
echo "Response Body:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";
