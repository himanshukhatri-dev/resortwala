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
        // For now, log and we can later create BookingConfirmationMail
        Log::info("Sending Booking Confirmation to {$booking->CustomerName} ({$booking->CustomerEmail})");
        
        // Example of sending to multiple parties as per requirement
        // if ($booking->CustomerEmail) Mail::to($booking->CustomerEmail)->send(new BookingMail($booking, 'customer'));
        // if ($booking->property->vendor->email) Mail::to($booking->property->vendor->email)->send(new BookingMail($booking, 'vendor'));
        // Mail::to(config('mail.admin_address'))->send(new BookingMail($booking, 'admin'));
    }

    public function sendPropertyStatusNotif($property, $status)
    {
        $vendor = $property->vendor;
        if (!$vendor || !$vendor->email) return;

        Log::info("Property '{$property->Name}' status changed to '{$status}'. Notifying vendor {$vendor->email}");
        // Mail::to($vendor->email)->send(new PropertyStatusMail($property, $status));
    }
}
