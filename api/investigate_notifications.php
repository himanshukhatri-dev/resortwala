<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

echo "=== Booking & Notification Investigation ===\n\n";

$booking = Booking::with('property.vendor')->orderBy('created_at', 'desc')->first();

if (!$booking) {
    echo "No bookings found in database.\n";
    exit;
}

echo "Latest Booking Details:\n";
echo "ID: " . $booking->BookingId . "\n";
echo "Status: " . $booking->Status . "\n";
echo "Payment Status: " . $booking->payment_status . "\n";
echo "Payment Method: " . $booking->payment_method . "\n";
echo "Customer Email: " . $booking->CustomerEmail . "\n";
echo "Created At: " . $booking->created_at . "\n\n";

if ($booking->property) {
    echo "Property: " . $booking->property->Name . "\n";
    if ($booking->property->vendor) {
        echo "Vendor: " . $booking->property->vendor->name . " (" . $booking->property->vendor->email . ")\n";
    } else {
        echo "Vendor: NOT FOUND attached to property\n";
    }
} else {
    echo "Property: NOT FOUND attached to booking\n";
}

echo "\nChecking Notification Triggers:\n";
$triggers = \App\Models\NotificationTrigger::where('is_active', true)->pluck('event_name')->toArray();
echo "Active Triggers: " . implode(', ', $triggers) . "\n";

echo "\nMail Configuration:\n";
echo "MAIL_MAILER: " . config('mail.default') . "\n";
echo "MAIL_HOST: " . config('mail.mailers.smtp.host') . "\n";
echo "MAIL_FROM: " . config('mail.from.address') . "\n";

echo "\nTesting Notification Service logic (Dry Run):\n";
$notif = app(\App\Services\NotificationService::class);
echo "Calling sendBookingConfirmation for Booking ID: " . $booking->BookingId . "\n";
// We won't actually call it to avoid sending double emails if it works, 
// but we already analyzed the code and saw the 'Confirmed' vs 'Booked' issue.

echo "\nDone.\n";
