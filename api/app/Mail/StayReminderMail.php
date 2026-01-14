<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class StayReminderMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $booking;

    public function __construct($booking)
    {
        $this->booking = $booking;
    }

    public function build()
    {
        $propertyName = $this->booking->property->Name ?? 'ResortWala Property';
        return $this->subject("Your Stay at {$propertyName} Starts Tomorrow! 📅")
                    ->view('emails.stay_reminder');
    }
}
