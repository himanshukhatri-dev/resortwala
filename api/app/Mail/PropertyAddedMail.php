<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\PropertyMaster;
use App\Models\User;

class PropertyAddedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $property;
    public $vendor;

    /**
     * Create a new message instance.
     */
    public function __construct(PropertyMaster $property, User $vendor)
    {
        $this->property = $property;
        $this->vendor = $vendor;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Property Added - ' . $this->property->Name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.property_added',
            with: [
                'property' => $this->property,
                'vendor' => $this->vendor,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
