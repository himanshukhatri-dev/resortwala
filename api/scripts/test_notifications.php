<?php

use App\Models\Booking;
use App\Services\NotificationService;
use App\Enums\BookingStatus;

/**
 * Test Notification Dispatching
 */
function testNotifications()
{
    $booking = Booking::with('property')->first();
    if (!$booking) {
        echo "No booking found to test.\n";
        return;
    }

    $notif = app(NotificationService::class);
    echo "Testing Notifications for Booking #{$booking->BookingId}...\n";

    echo "1. Testing Payment Received (Customer)...\n";
    $notif->sendPaymentReceivedCustomer($booking);

    echo "2. Testing Booking Confirmed (Customer)...\n";
    $notif->sendBookingConfirmedCustomer($booking);

    echo "3. Testing Booking Rejected (Customer)...\n";
    $notif->sendBookingRejectedCustomer($booking, 'Property maintenance');

    echo "Done. Check laravel logs or notification_logs table.\n";
}

testNotifications();
