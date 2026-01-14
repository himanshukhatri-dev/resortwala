<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class RefundCompletedMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $amount;
    public $transactionId;

    public function __construct($booking, $amount, $transactionId = null)
    {
        $this->booking = $booking;
        $this->amount = $amount;
        $this->transactionId = $transactionId;
    }

    public function build()
    {
        return $this->subject('Refund Completed - ' . ($this->booking->booking_reference ?? ''))
                    ->view('emails.refund_completed');
    }
}
