<?php
/**
 * Standalone PhonePe Production Verification Script (v5 - THE FINAL PROBE)
 * Tries the 'merchants.phonepe.com' host which is often used for Standard Redirects.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    header('Content-Type: text/html');
    echo "<html><body style='font-family: monospace; line-height: 1.5; max-width: 1000px; margin: 20px auto; padding: 20px; background: #fffcf0; border: 2px solid #EAB308; border-radius: 12px;'>";
    echo "<h2 style='color: #854d0e;'>PhonePe PRODUCTION Final Probe (v5)</h2>";
    echo "<div style='color: #a16207; margin-bottom: 20px;'>Generated at: " . date('Y-m-d H:i:s') . "</div>";
} else {
    echo "PhonePe PRODUCTION Final Probe (v5)\n";
}

// Credentials from User
$merchantId = "M223R7WEM0IRX";
$saltKey = "156711f6-bdb7-4734-b490-f53d25b69d69";
$saltIndex = "1";

function debugLog($msg, $data = null, $type = 'info')
{
    global $isCli;
    $colors = ['info' => '#2563eb', 'success' => '#16a34a', 'error' => '#dc2626', 'warn' => '#d97706'];
    $color = $colors[$type] ?? '#333';

    if ($isCli) {
        echo "[" . strtoupper($type) . "] " . strip_tags($msg) . ($data ? "\n" . json_encode($data, JSON_PRETTY_PRINT) : "") . "\n";
    } else {
        echo "<div style='margin-bottom: 12px; padding: 8px; border-left: 4px solid $color; background: white;'>";
        echo "<strong><span style='color: $color;'>[" . strtoupper($type) . "]</span></strong> " . $msg;
        if ($data) {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            echo "<pre style='background: #f8fafc; padding: 8px; border-radius: 4px; font-size: 11px; margin-top: 5px; border: 1px solid #e2e8f0;'>$json</pre>";
        }
        echo "</div>";
    }
}

$endpoints = [
    'Merchants API' => 'https://merchants.phonepe.com/pg/v1/pay',
    'Hermes Standard' => 'https://api.phonepe.com/apis/hermes/pg/v1/pay',
    'Classic Direct' => 'https://api.phonepe.com/pg/v1/pay',
    'UAT Mirror' => 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'
];

foreach ($endpoints as $name => $url) {
    debugLog("PROBING: $name", ['url' => $url]);

    $txnId = "TEST_V5_" . time() . "_" . rand(10, 99);
    $payload = [
        'merchantId' => $merchantId,
        'merchantTransactionId' => $txnId,
        'merchantUserId' => "V5_USER",
        'amount' => 100, // ₹1
        'redirectUrl' => "https://resortwala.com",
        'redirectMode' => 'REDIRECT',
        'callbackUrl' => "https://api.resortwala.com/api/payment/callback",
        'mobileNumber' => "9999999999",
        'paymentInstrument' => ['type' => 'PAY_PAGE']
    ];

    $base64Payload = base64_encode(json_encode($payload));
    $checksum = hash('sha256', $base64Payload . "/pg/v1/pay" . $saltKey) . "###" . $saltIndex;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['request' => $base64Payload]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "X-VERIFY: $checksum",
        "X-MERCHANT-ID: $merchantId"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $resp = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    if ($info['http_code'] == 200) {
        $data = json_decode($resp, true);
        if ($data['success'] ?? false) {
            $payUrl = $data['data']['instrumentResponse']['redirectInfo']['url'];
            debugLog("PROBE SUCCESS! Endpoint: $name", null, 'success');
            echo "<div style='background: #f0fdf4; border: 3px solid #16a34a; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center;'>";
            echo "<h2 style='color: #166534; margin-top: 0;'>🎉 SUCCESSFUL PROBE!</h2>";
            echo "<p>We found the correct production endpoint for your account.</p>";
            echo "<a href='$payUrl' target='_blank' style='display: inline-block; padding: 15px 30px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s;' onmouseover='this.style.transform=\"scale(1.05)\"' onmouseout='this.style.transform=\"scale(1)\"'>Proceed to ₹1 Payment</a>";
            echo "<div style='margin-top: 15px; font-size: 11px; color: #166534;'>Endpoint: $url</div>";
            echo "</div>";
            break;
        } else {
            debugLog("200 Result but API Error", $data, 'warn');
        }
    } else {
        debugLog("HTTP FAILED: $name (" . $info['http_code'] . ")", $resp, 'error');
    }
}

debugLog("--- End of Final Probe ---");
if (!$isCli)
    echo "</body></html>";
