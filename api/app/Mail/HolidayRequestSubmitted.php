<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HolidayRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public $property;
    public $vendor;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($property, $vendor)
    {
        $this->property = $property;
        $this->vendor = $vendor;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('New Holiday Price Submitted')
                    ->view('emails.property_change')
                    ->with([
                        'subject' => 'New Holiday Price Submitted',
                        'type' => 'holiday_submitted',
                        'requestId' => null
                    ]);
    }
}
