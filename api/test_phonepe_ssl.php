<?php

require __DIR__ . '/vendor/autoload.php';

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Test PhonePe API connection directly
use PhonePe\common\utils\CurlHttpClient;

echo "Testing PhonePe API SSL connection...\n\n";

// Test URL - PhonePe sandbox health check or a simple endpoint
$testUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/test";

try {
    $headers = [
        'Content-Type' => 'application/json',
        'accept' => 'application/json'
    ];

    echo "Making request to: $testUrl\n";
    echo "SSL Verification: DISABLED (should work now)\n\n";

    // Try direct cURL test
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $testUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'accept: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    echo "HTTP Status Code: $httpCode\n";

    if ($error) {
        echo "cURL Error: $error\n";
    } else {
        echo "Success! No SSL errors.\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }

} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\n--- Testing CurlHttpClient class directly ---\n";

// Check if the file has our changes
$filePath = __DIR__ . '/vendor/phonepe/pg-php-sdk-v2/src/phonepe/sdk/pg/common/utils/CurlHttpClient.php';
$fileContent = file_get_contents($filePath);

if (strpos($fileContent, 'CURLOPT_SSL_VERIFYPEER') !== false) {
    echo "✓ CurlHttpClient.php contains SSL bypass code\n";
} else {
    echo "✗ CurlHttpClient.php does NOT contain SSL bypass code\n";
}

if (strpos($fileContent, 'curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false)') !== false) {
    echo "✓ SSL verification is disabled in the code\n";
} else {
    echo "✗ SSL verification is NOT disabled in the code\n";
}
