<?php

$merchantId = "PGTESTPAYUAT86";
$saltKey = "96434309-7796-489d-8924-ab56988a6076";
$saltIndex = 1;

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "\n==============================================\n";
echo "TESTING CONFIGURATION\n";
echo "MID: $merchantId\n";
echo "----------------------------------------------\n";

// Generate Payload
$payload = [
    'merchantId' => $merchantId,
    'merchantTransactionId' => "TEST_" . time() . "_" . rand(1000, 9999),
    'merchantUserId' => "USER_123",
    'amount' => 100, // 1 Rupee
    'redirectUrl' => "https://resortwala.com/success",
    'redirectMode' => "REDIRECT",
    'callbackUrl' => "https://resortwala.com/callback",
    'mobileNumber' => "9999999999",
    'paymentInstrument' => ['type' => 'PAY_PAGE']
];

$base64 = base64_encode(json_encode($payload));
$path = "/pg/v1/pay";
$checksumString = $base64 . $path . $saltKey;
$checksum = hash('sha256', $checksumString) . '###' . $saltIndex;

$urls = [
    "https://api.phonepe.com/pg/v1/pay",
    "https://api.phonepe.com/apis/hermes/pg/v1/pay",
    "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
];

foreach ($urls as $url) {
    echo "\n----------------------------------------------\n";
    echo "Testing URL: $url\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['request' => $base64]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-VERIFY: ' . $checksum,
        'X-MERCHANT-ID: ' . $merchantId
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // curl_setopt($ch, CURLOPT_VERBOSE, true);

    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    echo "HTTP CODE: $code\n";
    if ($err) {
        echo "CURL ERROR: $err\n";
    }
    // Print first 500 chars of body
    echo "BODY: " . substr($resp, 0, 500) . "\n";
}
echo "==============================================\n";
