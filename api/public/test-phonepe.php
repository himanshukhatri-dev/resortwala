<?php
/**
 * Official PhonePe SDK Test Script (SDK v2)
 */

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    die("ERROR: vendor/autoload.php not found. Please run 'composer install' in the api folder.");
}

require $autoloadPath;

use PhonePe\payments\v2\standardCheckout\StandardCheckoutClient;
use PhonePe\payments\v2\models\request\builders\StandardCheckoutPayRequestBuilder;
use PhonePe\Env;

// REAL CREDENTIALS
$clientId = "SU2512151740277878517471";
$clientSecret = "156711f6-bdb7-4734-b490-f53d25b69d69";
$clientVersion = 1;
$env = Env::PRODUCTION;

// Check if class exists before initializing
if (!class_exists('PhonePe\payments\v2\standardCheckout\StandardCheckoutClient')) {
    die("ERROR: PhonePe SDK classes not found. Your 'composer install' might have failed to download the custom repository. Please check your terminal output.");
}

$phonepeClient = StandardCheckoutClient::getInstance(
    $clientId,
    $clientVersion,
    $clientSecret,
    $env
);

$merchantOrderId = "ORDER-" . uniqid();
$amount = 100; // ₹1 in paise

$payRequest = (new StandardCheckoutPayRequestBuilder())
    ->merchantOrderId($merchantOrderId)
    ->amount($amount)
    ->redirectUrl("https://resortwala.com/booking/success")
    ->build();

try {
    echo "=====================================\n";
    echo " PhonePe SDK Production Test\n";
    echo "=====================================\n\n";
    echo "Initiating payment...\n";

    $payResponse = $phonepeClient->pay($payRequest);

    if ($payResponse->getState() === "PENDING") {
        echo "✅ SUCCESS! Redirecting to PhonePe...\n\n";
        echo "Click the link below to pay ₹1:\n";
        echo $payResponse->getRedirectUrl() . "\n";
        // header("Location: " . $payResponse->getRedirectUrl());
        exit();
    } else {
        echo "❌ Payment initiation failed: " . $payResponse->getState() . "\n";
        print_r($payResponse);
    }

} catch (\PhonePe\common\exceptions\PhonePeException $e) {
    echo "❌ SDK Exception: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString();
} catch (\Exception $e) {
    echo "❌ General Error: " . $e->getMessage();
}
