<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class BookingCancellationMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $recipientType; // 'admin', 'vendor', 'customer'

    public function __construct($booking, $recipientType = 'customer')
    {
        $this->booking = $booking;
        $this->recipientType = $recipientType;
    }

    public function build()
    {
        $subject = 'Booking Cancelled - ' . ($this->booking->booking_reference ?? '');

        if ($this->recipientType === 'vendor') {
            $subject = 'Cancellation Alert: Booking Cancelled - ' . ($this->booking->CustomerName ?? '');
        } elseif ($this->recipientType === 'admin') {
            $subject = '[Admin] Booking Cancelled - ' . ($this->booking->booking_reference ?? '');
        }

        return $this->subject($subject)
                    ->view('emails.booking_cancellation');
    }
}
