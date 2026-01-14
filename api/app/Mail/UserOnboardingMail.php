<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserOnboardingMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $name;
    public $onboardingUrl;
    public $role;
    public $status; // 'welcome', 'approved', 'rejected'

    public function __construct($name, $onboardingUrl, $role, $status = 'welcome')
    {
        $this->name = $name;
        $this->onboardingUrl = $onboardingUrl;
        $this->role = $role;
        $this->status = $status;
    }

    public function build()
    {
        $subject = 'Welcome to ResortWala - Complete Your Registration';

        if ($this->status === 'approved') {
            $subject = 'Account Approved! - Welcome to ResortWala';
        } elseif ($this->status === 'rejected') {
            $subject = 'Account Update - ResortWala';
        }

        return $this->subject($subject)
                    ->view('emails.vendor.onboarding');
    }
}
