<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingLog;
use App\Enums\BookingStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BookingStateService
{
    /**
     * Transition a booking to BOOKED state (Payment Received)
     */
    public function markAsPayed(Booking $booking, $transactionId = null)
    {
        // IDEMPOTENCY: If already paid or booked, do nothing
        if ($booking->payment_status === 'paid' || $booking->Status === BookingStatus::BOOKED) {
            Log::info("BookingStateService: Skipping markAsPayed for #{$booking->BookingId} (Already processed)");
            return $booking;
        }

        return DB::transaction(function () use ($booking, $transactionId) {
            $from = $booking->Status;
            $booking->Status = BookingStatus::BOOKED;
            $booking->payment_status = 'paid';
            if ($transactionId) {
                $booking->transaction_id = $transactionId;
            }
            $booking->save();

            $this->logTimeline($booking, 'status_change', $from, BookingStatus::BOOKED, "Payment verified manually/callback. ID: {$transactionId}");

            // Soft Hold Logic would go here
            // e.g. record temporary reservation in another table if needed

            // Trigger Event 1 Notifications
            $this->notifyPaymentReceived($booking);

            return $booking;
        });
    }

    /**
     * Transition a booking to CONFIRMED state (Vendor Approved)
     */
    public function confirm(Booking $booking)
    {
        return DB::transaction(function () use ($booking) {
            $from = $booking->Status;
            $booking->Status = BookingStatus::CONFIRMED;
            $booking->save();

            $this->logTimeline($booking, 'status_change', $from, BookingStatus::CONFIRMED, "Vendor approved via portal.");

            // Hard Block Logic would go here

            // Trigger Event 2 Notifications
            $this->notifyBookingConfirmed($booking);

            return $booking;
        });
    }

    /**
     * Transition a booking to REJECTED state (Vendor Declined)
     */
    public function reject(Booking $booking, $reason = null)
    {
        return DB::transaction(function () use ($booking, $reason) {
            $from = $booking->Status;
            $booking->Status = BookingStatus::REJECTED;
            $booking->save();

            $this->logTimeline($booking, 'status_change', $from, BookingStatus::REJECTED, "Vendor rejected request. Reason: {$reason}");

            // Release Slot Logic

            // Trigger Notifications
            $this->notifyBookingRejected($booking, $reason);

            return $booking;
        });
    }

    /**
     * Transition a booking to CANCELLED state
     */
    public function cancel(Booking $booking)
    {
        return DB::transaction(function () use ($booking) {
            $from = $booking->Status;
            $booking->Status = BookingStatus::CANCELLED;
            $booking->save();

            $this->logTimeline($booking, 'status_change', $from, BookingStatus::CANCELLED, "System or User cancelled.");

            // Release Slot Logic

            return $booking;
        });
    }

    /**
     * Event 1: Payment Received Notifications
     */
    protected function notifyPaymentReceived(Booking $booking)
    {
        try {
            $notif = app(NotificationService::class);
            $notif->sendPaymentReceivedCustomer($booking);
            $notif->sendNewBookingRequestVendor($booking);
        } catch (\Exception $e) {
            Log::error("Failed to send BOOKED notifications for #{$booking->BookingId}: " . $e->getMessage());
        }
    }

    /**
     * Event 2: Booking Confirmed Notifications
     */
    protected function notifyBookingConfirmed(Booking $booking)
    {
        try {
            $notif = app(NotificationService::class);
            $notif->sendBookingConfirmedCustomer($booking);
            $notif->sendBookingConfirmedVendor($booking);
        } catch (\Exception $e) {
            Log::error("Failed to send CONFIRMED notifications for #{$booking->BookingId}: " . $e->getMessage());
        }
    }

    protected function notifyBookingRejected(Booking $booking, $reason)
    {
        try {
            $notif = app(NotificationService::class);
            $notif->sendBookingRejectedCustomer($booking, $reason);
            $notif->sendBookingRejectedVendor($booking, $reason);
        } catch (\Exception $e) {
            Log::error("Failed to send REJECTED notifications for #{$booking->BookingId}: " . $e->getMessage());
        }
    }

    protected function logTimeline(Booking $booking, $type, $from, $to, $message)
    {
        BookingLog::create([
            'booking_id' => $booking->BookingId,
            'event_type' => $type,
            'from_status' => $from,
            'to_status' => $to,
            'message' => $message,
            'metadata' => ['user_id' => auth()->id() ?? 0]
        ]);
    }
}
