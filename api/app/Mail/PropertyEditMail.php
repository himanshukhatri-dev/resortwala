<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class PropertyEditMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $property;
    public $status; // 'submitted', 'approved', 'rejected'

    public function __construct($property, $status)
    {
        $this->property = $property;
        $this->status = $status;
    }

    public function build()
    {
        $subject = 'Property Edit Update';

        if ($this->status === 'submitted') {
            $subject = 'Edit Request Submitted - ' . ($this->property->Name ?? '');
        } elseif ($this->status === 'approved') {
            $subject = 'Edits Approved - ' . ($this->property->Name ?? '');
        } elseif ($this->status === 'rejected') {
            $subject = 'Edits Rejected - ' . ($this->property->Name ?? '');
        }

        return $this->subject($subject)
                    ->view('emails.property_edits');
    }
}
