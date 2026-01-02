<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HolidayStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $holiday;
    public $status; // 'approved' or 'rejected'
    public $reason;

    public function __construct($holiday, $status, $reason = null)
    {
        $this->holiday = $holiday;
        $this->status = $status;
        $this->reason = $reason;
    }

    public function build()
    {
        $subject = "Holiday Rate Update - " . ($this->status === 'approved' ? 'Approved' : 'Rejected');
        
        return $this->subject($subject)
                    ->view('emails.holiday_status_updated'); 
                    // We'll create a simple view or use raw text if view creation is too complex for this step, 
                    // but let's try to stick to standard Laravel views.
                    // Actually, for simplicity and speed, let's use the text method or a generic view if available.
                    // If no view exists, we can use ->html() or ->text().
                    // Let's use a simple HTML string for now to avoid creating a blade file if not strictly necessary,
                    // but creating a blade is better practice. I'll verify if `emails` directory exists.
    }
}
