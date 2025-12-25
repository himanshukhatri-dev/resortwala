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

class PropertyEditRequestActioned extends Mailable
{
    use Queueable, SerializesModels;

    public $property;
    public $vendor;
    public $status; // 'approved' or 'rejected'

    /**
     * Create a new message instance.
     */
    public function __construct(PropertyMaster $property, User $vendor, $status)
    {
        $this->property = $property;
        $this->vendor = $vendor;
        $this->status = $status;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->status === 'approved' 
            ? 'Property Changes Approved' 
            : 'Property Changes Rejected';

        return new Envelope(
            subject: $subject . ' - ' . $this->property->Name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $type = $this->status === 'approved' ? 'request_approved' : 'request_rejected';
        $subject = $this->status === 'approved' ? 'Changes Approved' : 'Changes Rejected';

        return new Content(
            view: 'emails.property_change',
            with: [
                'type' => $type,
                'subject' => $subject,
                'property' => $this->property,
                'vendor' => $this->vendor,
                'requestId' => null
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
