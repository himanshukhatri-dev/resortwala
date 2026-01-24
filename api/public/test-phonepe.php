<?php
header('Content-Type: text/plain');

$merchantId = "M223R7WEM0IRX";
$clientId = "SU2512151740277878517471";
$clientSecret = "156711f6-bdb7-4734-b490-f53d25b69d69";
$saltKey = "156711f6-bdb7-4734-b490-f53d25b69d69"; // Re-using as Salt Key as per current pattern
$saltIndex = "1";
$env = "PROD";

echo "PhonePe Standalone Test Initiation\n";
echo "Merchant ID: $merchantId\n";
echo "Client ID: $clientId\n";
echo "----------------------------------\n";

$tokenUrl = "https://api.phonepe.com/apis/hermes/oauth/v1/token";

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
$postData = http_build_query([
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'grant_type' => 'client_credentials'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$tokenResp = curl_exec($ch);
if ($tokenResp === false) {
    echo "CURL Error: " . curl_error($ch) . "\n";
}
$info = curl_getinfo($ch);
curl_close($ch);

echo "Token API Status: " . $info['http_code'] . "\n";
echo "Token Response: " . print_r($tokenResp, true) . "\n\n";
if ($info['http_code'] == 200) {
    if ($tokenResp) {
        $data = json_decode($tokenResp, true);
        $accessToken = $data['access_token'] ?? null;
        echo "Token Generated Successfully!\n";
        echo "Access Token (first 20): " . substr($accessToken, 0, 20) . "...\n\n";
    }
} else {
    echo "OAuth Token Generation FAILED with status: " . $info['http_code'] . "\n\n";
}

echo "Attempting Standard Payment Initiation (№ Token, Checksum only)...\n";
$payUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
$txnId = "TEST_STD_" . time();
$payload = [
    'merchantId' => $merchantId,
    'merchantTransactionId' => $txnId,
    'merchantUserId' => "TEST_USER_STD",
    'amount' => 100, // ₹1
    'redirectUrl' => "https://resortwala.com/success",
    'redirectMode' => 'REDIRECT',
    'callbackUrl' => "https://resortwala.com/api/payment/callback",
    'mobileNumber' => "9999999999",
    'paymentInstrument' => ['type' => 'PAY_PAGE']
];

$base64Payload = base64_encode(json_encode($payload));
$checksum = hash('sha256', $base64Payload . "/pg/v1/pay" . $saltKey) . "###" . $saltIndex;

$ch = curl_init($payUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['request' => $base64Payload]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "X-VERIFY: $checksum",
    "X-MERCHANT-ID: $merchantId"
]);

$payResp = curl_exec($ch);
$payInfo = curl_getinfo($ch);
curl_close($ch);

echo "Standard Pay API Status: " . $payInfo['http_code'] . "\n";
echo "Standard Pay Response: $payResp\n";

