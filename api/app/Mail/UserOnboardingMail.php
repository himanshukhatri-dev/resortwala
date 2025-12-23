<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserOnboardingMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $onboardingUrl;
    public $role;

    public function __construct($name, $onboardingUrl, $role)
    {
        $this->name = $name;
        $this->onboardingUrl = $onboardingUrl;
        $this->role = $role;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to ResortWala - Complete Your Registration',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.onboarding',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
