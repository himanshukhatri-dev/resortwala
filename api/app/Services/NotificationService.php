<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class NotificationService
{
    /**
     * Send OTP via Email.
     *
     * @param string $email
     * @param string $otp
     * @param string $type
     * @return void
     */
    public function sendEmailOTP($email, $otp, $type = 'login')
    {
        try {
            Mail::to($email)->send(new OtpMail($otp, $type));
            Log::info("OTP Email sent to {$email} (Type: {$type})");
        } catch (\Exception $e) {
            Log::error("Failed to send OTP Email to {$email}: " . $e->getMessage());
        }
    }

    /**
     * Send OTP via SMS.
     *
     * @param string $phone
     * @param string $otp
     * @param string $type
     * @return void
     */
    public function sendSMSOTP($phone, $otp, $type = 'login')
    {
        try {
            // TODO: Integrate with SMS provider (MSG91, Twilio, etc.)
            // For now, just log the OTP
            $message = "Your ResortWala verification code is: {$otp}. Valid for 10 minutes.";
            
            Log::info("SMS OTP to {$phone}: {$otp} (Type: {$type})");
            
            // Example MSG91 integration (uncomment when configured):
            // $apiKey = env('MSG91_API_KEY');
            // $senderId = env('MSG91_SENDER_ID');
            // $url = "https://api.msg91.com/api/v5/otp";
            // Http::post($url, [
            //     'authkey' => $apiKey,
            //     'mobile' => $phone,
            //     'message' => $message,
            //     'sender' => $senderId,
            //     'otp' => $otp
            // ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to send SMS OTP to {$phone}: " . $e->getMessage());
        }
    }

    public function sendBookingConfirmation($booking)
    {
        // 1. Notify Admin (Developer)
        try {
            Mail::to('himanshukhatri.1988@gmail.com')->send(new \App\Mail\BookingMail($booking, 'new_request_admin'));
            Log::info("Sent Admin Notification to himanshukhatri.1988@gmail.com");
        } catch (\Exception $e) {
            Log::error("Failed to send Admin Email: " . $e->getMessage());
        }

        // 2. Notify Vendor
        try {
            if ($booking->property && $booking->property->vendor && $booking->property->vendor->email) {
                Mail::to($booking->property->vendor->email)->send(new \App\Mail\BookingMail($booking, 'new_request_vendor'));
                Log::info("Sent Vendor Notification to " . $booking->property->vendor->email);
            }
        } catch (\Exception $e) {
            Log::error("Failed to send Vendor Email: " . $e->getMessage());
        }

        // 3. Notify Customer (if source is customer_app and confirmed immediately)
        if ($booking->Status === 'Confirmed' && $booking->CustomerEmail) {
            try {
                Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, 'confirmed_customer'));
                Log::info("Sent Customer Confirmation to " . $booking->CustomerEmail);
            } catch (\Exception $e) {
                Log::error("Failed to send Customer Email: " . $e->getMessage());
            }
        }
    }

    public function sendBookingStatusUpdate($booking, $status)
    {
        if (!$booking->CustomerEmail) return;

        try {
            $type = ($status === 'Confirmed' || $status === 'confirmed') ? 'confirmed_customer' : 'status_update_customer';
            Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, $type));
            Log::info("Sent Booking Status Update ({$status}) to {$booking->CustomerEmail}");
        } catch (\Exception $e) {
            Log::error("Failed to send Status Update Email: " . $e->getMessage());
        }

        // WhatsApp Placeholder
        // $this->sendWhatsApp($booking->CustomerMobile, "Your booking status for {$booking->property->Name} is now: {$status}");
    }
}
