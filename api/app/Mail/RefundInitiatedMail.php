<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class RefundInitiatedMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $booking; /* Or Refund Model */
    public $amount;

    public function __construct($booking, $amount)
    {
        $this->booking = $booking;
        $this->amount = $amount;
    }

    public function build()
    {
        return $this->subject('Refund Initiated - ' . ($this->booking->booking_reference ?? ''))
                    ->view('emails.refund_initiated');
    }
}
