<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $type; // 'new_request_vendor', 'new_request_admin', 'status_update_customer', 'confirmed_customer'

    public function __construct($booking, $type)
    {
        $this->booking = $booking;
        $this->type = $type;
    }

    public function build()
    {
        $subject = 'ResortWala Notification';

        if ($this->type === 'new_request_vendor') {
            $subject = 'Action Required: New Booking Request - ' . $this->booking->CustomerName;
        } elseif ($this->type === 'new_request_admin') {
            $subject = '[Admin] New Booking Request - ' . $this->booking->property->Name;
        } elseif ($this->type === 'status_update_customer') {
            $subject = 'Update on your Booking Request - ' . $this->booking->property->Name;
        } elseif ($this->type === 'confirmed_customer') {
            $subject = 'Booking Confirmed! - ' . $this->booking->property->Name;
        }

        return $this->subject($subject)
                    ->view('emails.booking');
    }
}
