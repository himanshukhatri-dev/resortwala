<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function sendBookingConfirmation($booking)
    {
        // Stub: Log to file instead of sending real SMS/Email for now
        Log::info("Sending Booking Confirmation to {$booking->CustomerName} ({$booking->CustomerMobile})");
        Log::info("Booking Details: Ref #{$booking->BookingId}, Dates: {$booking->CheckInDate} to {$booking->CheckOutDate}");
        
        // Simulating Whatsapp API call
        // Http::post('https://whatsapp-api.com/send', [...]);
    }
}
