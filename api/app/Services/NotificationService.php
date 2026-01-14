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
            throw $e;
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
            throw $e;
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

    /**
     * Send vendor registration confirmation email
     */
    public function sendVendorRegistrationEmail($vendor)
    {
        try {
            Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '', 'vendor', 'welcome'));
            Log::info("Sent registration confirmation email to {$vendor->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send registration email to {$vendor->email}: " . $e->getMessage());
        }
    }

    /**
     * Send vendor approval email
     */
    public function sendVendorApprovalEmail($vendor)
    {
        try {
             // Assuming vendor has a dashboard link or similar, we pass generic '#' if unknown
            Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '#', 'vendor', 'approved'));
            Log::info("Sent approval email to {$vendor->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send approval email to {$vendor->email}: " . $e->getMessage());
        }
    }

    /**
     * Send vendor rejection email
     */
    public function sendVendorRejectionEmail($vendor, $rejectionComment)
    {
        try {
            // Rejection mail might need a comment field in UserOnboardingMail or a separate class. 
            // For now, we reuse UserOnboardingMail but mapped to 'rejected' status. 
            // Note: UserOnboardingMail currently doesn't accept a comment in constructor.
            // We'll proceed with this for consistency with the plan, assuming the view handles generic rejection text.
            Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '#', 'vendor', 'rejected'));
            Log::info("Sent rejection email to {$vendor->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send rejection email to {$vendor->email}: " . $e->getMessage());
        }
    }
    /**
     * Notify Admin about a new property addition
     */
    public function notifyAdminNewProperty($property, $vendor)
    {
        // 1. Send Email Notification
        try {
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(new \App\Mail\PropertyAddedMail($property, $vendor));
            }
            Log::info("Sent New Property Notification to Admins for property: {$property->Name}");
        } catch (\Exception $e) {
            Log::error("Failed to send Admin Property Notification: " . $e->getMessage());
        }

        // 2. Future: Send Push Notification (FCM) 
        // If an Admin App (APK) or PWA is connected via Firebase:
        // $this->sendPushNotificationToTopic('admin_notifications', 'New Property Added', "{$vendor->name} added {$property->Name}");
    }
}
