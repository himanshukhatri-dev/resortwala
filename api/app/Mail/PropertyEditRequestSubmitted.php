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

class PropertyEditRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public $property;
    public $vendor;
    public $requestId;

    /**
     * Create a new message instance.
     */
    public function __construct(PropertyMaster $property, User $vendor, $requestId)
    {
        $this->property = $property;
        $this->vendor = $vendor;
        $this->requestId = $requestId;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Property Edit Request Submitted - ' . $this->property->Name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.property_change',
            with: [
                'type' => 'request_submitted',
                'subject' => 'Property Edit Request Submitted',
                'property' => $this->property,
                'vendor' => $this->vendor,
                'requestId' => $this->requestId
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
