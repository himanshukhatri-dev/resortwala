<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class CalendarUpdateMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $property;
    public $updateType; // 'holiday_price', 'freeze', 'unfreeze'
    public $details; // Array with dates, price, etc.

    public function __construct($property, $updateType, $details = [])
    {
        $this->property = $property;
        $this->updateType = $updateType;
        $this->details = $details;
    }

    public function build()
    {
        $subject = 'Calendar Update - ' . ($this->property->Name ?? '');

        if ($this->updateType === 'holiday_price') {
            $subject = 'Holiday Price Updated - ' . ($this->property->Name ?? '');
        } elseif ($this->updateType === 'freeze') {
            $subject = 'Dates Frozen - ' . ($this->property->Name ?? '');
        } elseif ($this->updateType === 'unfreeze') {
            $subject = 'Dates Unfrozen - ' . ($this->property->Name ?? '');
        }

        return $this->subject($subject)
                    ->view('emails.calendar_update');
    }
}
