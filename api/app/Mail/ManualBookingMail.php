<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class ManualBookingMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $booking; // Or request object
    public $status; // 'received', 'approved', 'rejected'

    public function __construct($booking, $status)
    {
        $this->booking = $booking;
        $this->status = $status;
    }

    public function build()
    {
        $subject = 'Booking Request Update';

        if ($this->status === 'received') {
            $subject = 'New Client Request Received';
        } elseif ($this->status === 'approved') {
            $subject = 'Client Request Approved';
        } elseif ($this->status === 'rejected') {
            $subject = 'Client Request Rejected';
        }

        return $this->subject($subject)
                    ->view('emails.manual_booking_action');
    }
}
