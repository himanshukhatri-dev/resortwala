<?php

use App\Models\Booking;
use App\Enums\BookingStatus;
use App\Services\BookingStateService;
use Illuminate\Support\Facades\Log;

/**
 * Test Script for Booking Lifecycle
 */
function testLifecycle()
{
    $stateService = app(BookingStateService::class);

    // 1. Find or create a test booking
    $booking = Booking::first() ?: Booking::factory()->create(['Status' => BookingStatus::INITIATED]);
    echo "Testing Booking ID: {$booking->BookingId} (Initial Status: {$booking->Status})\n";

    // 2. Simulate Payment Success
    echo "Simulating Payment Success...\n";
    $stateService->markAsPayed($booking, 'TEST_TXN_' . time());
    echo "Status after payment: {$booking->fresh()->Status} (Expected: Booked)\n";

    // 3. Simulate Vendor Approval
    echo "Simulating Vendor Approval...\n";
    $stateService->confirm($booking);
    echo "Status after approval: {$booking->fresh()->Status} (Expected: Confirmed)\n";

    // 4. Check Timeline
    $logs = \App\Models\BookingLog::where('booking_id', $booking->BookingId)->get();
    echo "Timeline Logs Count: " . $logs->count() . "\n";
    foreach ($logs as $log) {
        echo " - [{$log->event_type}] {$log->from_status} -> {$log->to_status}: {$log->message}\n";
    }

    // 5. Simulate Payment Failure handling in Controller (Conceptual)
    echo "Note: PaymentController now explicitly sets status to CANCELLED on failure.\n";
}

testLifecycle();
