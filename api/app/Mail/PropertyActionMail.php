<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class PropertyActionMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $property;
    public $action; // 'approved', 'rejected', 'deleted'
    public $reason; // Optional reason for rejection

    public function __construct($property, $action, $reason = null)
    {
        $this->property = $property;
        $this->action = $action;
        $this->reason = $reason;
    }

    public function build()
    {
        $subject = 'Property Update - ' . ($this->property->Name ?? 'Unknown');

        if ($this->action === 'approved') {
            $subject = 'Property Approved! - ' . ($this->property->Name ?? '');
        } elseif ($this->action === 'rejected') {
            $subject = 'Action Required: Property Rejected - ' . ($this->property->Name ?? '');
        } elseif ($this->action === 'deleted') {
            $subject = 'Property Deleted - ' . ($this->property->Name ?? '');
        }

        return $this->subject($subject)
                    ->view('emails.property_lifecycle');
    }
}
