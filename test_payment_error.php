<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\PhonePeService;
use App\Models\Booking;

try {
    // Mock Booking
    $booking = new Booking();
    $booking->BookingId = 'TEST_123';
    $booking->TotalAmount = 100;
    $booking->paid_amount = 0;

    $service = new PhonePeService();
    // This calls the internal logic that fails
    $result = $service->initiatePayment($booking, 'http://test.com/callback');

    print_r($result);

} catch (\Exception $e) {
    echo "Caught Exception: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
} catch (\Error $e) {
    echo "Caught Error: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
