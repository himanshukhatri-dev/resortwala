<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Services\NotificationEngine;

class NotificationService
{
    protected $engine;

    public function __construct(NotificationEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Send OTP via Email.
     */
    public function sendEmailOTP($email, $otp, $type = 'login')
    {
        // Try System Engine First
        if ($this->engine->dispatch('otp.email', ['email' => $email], ['otp' => $otp, 'type' => $type])) {
            return;
        }

        // Fallback to legacy
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
     */
    public function sendSMSOTP($phone, $otp, $type = 'login')
    {
        // Try System Engine First
        if ($this->engine->dispatch('otp.sms', ['mobile' => $phone], ['otp' => $otp, 'type' => $type])) {
            return;
        }

        // Fallback to legacy
        try {
            $message = "Your ResortWala verification code is: {$otp}. Valid for 10 minutes.";
            Log::info("SMS OTP to {$phone}: {$otp} (Type: {$type})");
        } catch (\Exception $e) {
            Log::error("Failed to send SMS OTP to {$phone}: " . $e->getMessage());
            throw $e;
        }
    }

    public function sendBookingConfirmation($booking)
    {
        $data = $booking->toArray();
        if ($booking->property)
            $data['property_name'] = $booking->property->Name;

        // 1. Notify Admin (Developer)
        if (!$this->engine->dispatch('booking.new_request_admin', ['email' => 'himanshukhatri.1988@gmail.com'], $data)) {
            // Legacy
            try {
                Mail::to('himanshukhatri.1988@gmail.com')->send(new \App\Mail\BookingMail($booking, 'new_request_admin'));
                Log::info("Sent Admin Notification to himanshukhatri.1988@gmail.com");
            } catch (\Exception $e) {
                Log::error("Failed to send Admin Email: " . $e->getMessage());
            }
        }

        // 2. Notify Vendor
        if ($booking->property && $booking->property->vendor && $booking->property->vendor->email) {
            if (!$this->engine->dispatch('booking.new_request_vendor', $booking->property->vendor, $data)) {
                // Legacy
                try {
                    Mail::to($booking->property->vendor->email)->send(new \App\Mail\BookingMail($booking, 'new_request_vendor'));
                    Log::info("Sent Vendor Notification to " . $booking->property->vendor->email);
                } catch (\Exception $e) {
                    Log::error("Failed to send Vendor Email: " . $e->getMessage());
                }
            }
        }

        // 3. Notify Customer
        if ($booking->Status === 'Confirmed' && $booking->CustomerEmail) {
            if (!$this->engine->dispatch('booking.confirmed_customer', ['email' => $booking->CustomerEmail], $data)) {
                // Legacy
                try {
                    Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, 'confirmed_customer'));
                    Log::info("Sent Customer Confirmation to " . $booking->CustomerEmail);
                } catch (\Exception $e) {
                    Log::error("Failed to send Customer Email: " . $e->getMessage());
                }
            }
        }
    }

    public function sendBookingStatusUpdate($booking, $status)
    {
        if (!$booking->CustomerEmail)
            return;

        $eventName = ($status === 'Confirmed' || $status === 'confirmed') ? 'booking.confirmed_customer' : 'booking.status_update_customer';
        $data = $booking->toArray();
        $data['status'] = $status;
        if ($booking->property)
            $data['property_name'] = $booking->property->Name;

        if (!$this->engine->dispatch($eventName, ['email' => $booking->CustomerEmail], $data)) {
            // Legacy
            try {
                Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, $eventName === 'booking.confirmed_customer' ? 'confirmed_customer' : 'status_update_customer'));
                Log::info("Sent Booking Status Update ({$status}) to {$booking->CustomerEmail}");
            } catch (\Exception $e) {
                Log::error("Failed to send Status Update Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Send vendor registration confirmation email
     */
    public function sendVendorRegistrationEmail($vendor)
    {
        if (!$this->engine->dispatch('vendor.registered', $vendor, ['name' => $vendor->name])) {
            try {
                Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '', 'vendor', 'welcome'));
                Log::info("Sent registration confirmation email to {$vendor->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send registration email to {$vendor->email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Send vendor approval email
     */
    public function sendVendorApprovalEmail($vendor)
    {
        if (!$this->engine->dispatch('vendor.approved', $vendor, ['name' => $vendor->name, 'login_url' => '#'])) {
            try {
                Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '#', 'vendor', 'approved'));
                Log::info("Sent approval email to {$vendor->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send approval email to {$vendor->email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Send vendor rejection email
     */
    public function sendVendorRejectionEmail($vendor, $rejectionComment)
    {
        if (!$this->engine->dispatch('vendor.rejected', $vendor, ['name' => $vendor->name, 'comment' => $rejectionComment])) {
            try {
                Mail::to($vendor->email)->send(new \App\Mail\UserOnboardingMail($vendor->name, '#', 'vendor', 'rejected'));
                Log::info("Sent rejection email to {$vendor->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send rejection email to {$vendor->email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Notify Admin about a new property addition
     */
    public function notifyAdminNewProperty($property, $vendor)
    {
        // 1. Send Email Notification
        // Since we don't have a single admin recipient usually, we loop.
        // The Engine dispatch is per recipient. 

        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            if (!$this->engine->dispatch('property.created_admin', $admin, ['property_name' => $property->Name, 'vendor_name' => $vendor->name])) {
                try {
                    Mail::to($admin->email)->send(new \App\Mail\PropertyAddedMail($property, $vendor));
                } catch (\Exception $e) {
                    Log::error("Failed to send Admin Property Notification: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Event 1: Payment Received - Customer Notification
     */
    public function sendPaymentReceivedCustomer($booking)
    {
        $data = $this->prepareBookingData($booking);
        $data['view'] = 'emails.booking';
        $data['type'] = 'payment_received_customer';
        $data['booking'] = $booking; // Pass model for view access

        if (!$this->engine->dispatch('booking.payment_received_customer', ['email' => $booking->CustomerEmail, 'mobile' => $booking->CustomerMobile], $data)) {
            // Legacy/Fallback
            try {
                Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, 'payment_received_customer'));
                Log::info("Sent Payment Received Notification to " . $booking->CustomerEmail);
            } catch (\Exception $e) {
                Log::error("Failed to send Payment Received Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Event 1: New Booking Request - Vendor Notification
     */
    public function sendNewBookingRequestVendor($booking)
    {
        if (!$booking->property || !$booking->property->vendor)
            return;

        $data = $this->prepareBookingData($booking);
        $vendor = $booking->property->vendor;

        if (!$this->engine->dispatch('booking.new_request_vendor', $vendor, $data)) {
            try {
                Mail::to($vendor->email)->send(new \App\Mail\BookingMail($booking, 'new_request_vendor'));
                Log::info("Sent New Request Notification to Vendor: " . $vendor->email);
            } catch (\Exception $e) {
                Log::error("Failed to send Vendor Request Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Event 2: Booking Confirmed - Customer Notification
     */
    public function sendBookingConfirmedCustomer($booking)
    {
        $data = $this->prepareBookingData($booking);
        $data['final_instructions'] = "Please carry your ID card. Reporting time is 11:00 AM.";

        if (!$this->engine->dispatch('booking.confirmed_customer', ['email' => $booking->CustomerEmail, 'mobile' => $booking->CustomerMobile], $data)) {
            try {
                Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, 'confirmed_customer'));
                Log::info("Sent Final Confirmation to " . $booking->CustomerEmail);
            } catch (\Exception $e) {
                Log::error("Failed to send Final Confirmation Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Event 2: Booking Confirmed - Vendor Notification
     */
    public function sendBookingConfirmedVendor($booking)
    {
        if (!$booking->property || !$booking->property->vendor)
            return;

        $data = $this->prepareBookingData($booking);
        $data['view'] = 'emails.booking';
        $data['type'] = 'confirmed_vendor'; // We can use one type for confirmed or make it vendor-specific
        $data['booking'] = $booking;
        $vendor = $booking->property->vendor;

        if (!$this->engine->dispatch('booking.confirmed_vendor', $vendor, $data)) {
            try {
                Mail::to($vendor->email)->send(new \App\Mail\BookingMail($booking, 'confirmed_vendor'));
                Log::info("Sent Confirmation Success to Vendor: " . $vendor->email);
            } catch (\Exception $e) {
                Log::error("Failed to send Vendor Confirmation Success Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Event: Booking Rejected - Customer Notification
     */
    public function sendBookingRejectedCustomer($booking, $reason = null)
    {
        $data = $this->prepareBookingData($booking);
        $data['reason'] = $reason ?? 'Vendor unavailability';
        $data['view'] = 'emails.booking';
        $data['type'] = 'rejected_customer';
        $data['booking'] = $booking;

        if (!$this->engine->dispatch('booking.rejected_customer', ['email' => $booking->CustomerEmail, 'mobile' => $booking->CustomerMobile], $data)) {
            try {
                Mail::to($booking->CustomerEmail)->send(new \App\Mail\BookingMail($booking, 'rejected_customer'));
                Log::info("Sent Rejection to Customer: " . $booking->CustomerEmail);
            } catch (\Exception $e) {
                Log::error("Failed to send Rejection Email: " . $e->getMessage());
            }
        }
    }

    /**
     * Event: Booking Rejected - Vendor Notification
     */
    public function sendBookingRejectedVendor($booking, $reason = null)
    {
        if (!$booking->property || !$booking->property->vendor)
            return;

        $data = $this->prepareBookingData($booking);
        $vendor = $booking->property->vendor;

        if (!$this->engine->dispatch('booking.rejected_vendor', $vendor, $data)) {
            try {
                // Usually vendor doesn't need an email for their own rejection, but good for audit
                Log::info("Vendor rejected booking #{$booking->BookingId}");
            } catch (\Exception $e) {
            }
        }
    }

    protected function prepareBookingData($booking)
    {
        $data = $booking->toArray();

        // Robust Property Name Resolution
        $propertyName = 'Resort';
        if ($booking->relationLoaded('property') && $booking->property) {
            $propertyName = $booking->property->Name;
        } elseif ($booking->property) {
            $propertyName = $booking->property->Name;
        } elseif (isset($data['property']['Name'])) {
            $propertyName = $data['property']['Name'];
        } elseif (isset($data['PropertyName'])) {
            $propertyName = $data['PropertyName'];
        }

        $data['property_name'] = $propertyName;
        $data['map_link'] = $booking->property->GoogleMapLink ?? $data['property']['GoogleMapLink'] ?? '#';

        // Normalize keys for template compatibility ({{customer_name}}, etc.)
        $data['id'] = $booking->BookingId;
        $data['booking_id'] = $booking->BookingId;
        $data['customer_name'] = $booking->CustomerName ?? $data['CustomerName'] ?? 'Customer';
        $data['customer_mobile'] = $booking->CustomerMobile ?? $data['CustomerMobile'];
        $data['customer_email'] = $booking->CustomerEmail ?? $data['CustomerEmail'];
        $data['check_in'] = $booking->CheckInDate ?? $data['CheckInDate'];
        $data['check_out'] = $booking->CheckOutDate ?? $data['CheckOutDate'];
        $data['total_amount'] = $booking->TotalAmount ?? $data['TotalAmount'];

        return $data;
    }
}
