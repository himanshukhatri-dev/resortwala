<?php

require __DIR__ . '/vendor/autoload.php';

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\Services\PhonePeService;
use App\Models\Booking;

echo "Testing PhonePe Service Integration...\n\n";

// Create a mock booking object
$mockBooking = new stdClass();
$mockBooking->BookingId = 'TEST123';
$mockBooking->TotalAmount = 100;
$mockBooking->paid_amount = 100;

try {
    $phonePeService = new PhonePeService();
    $callbackUrl = 'http://local.resortwala.com/api/payment/callback';

    echo "Calling PhonePeService->initiatePayment()...\n";
    $result = $phonePeService->initiatePayment($mockBooking, $callbackUrl);

    echo "\nResult:\n";
    print_r($result);

    if (isset($result['success']) && $result['success']) {
        echo "\n✓ SUCCESS! Payment initiation worked!\n";
    } else {
        echo "\n✗ FAILED: " . ($result['message'] ?? 'Unknown error') . "\n";
        if (isset($result['debug'])) {
            echo "Debug info:\n";
            print_r($result['debug']);
        }
    }

} catch (Exception $e) {
    echo "\n✗ Exception: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
