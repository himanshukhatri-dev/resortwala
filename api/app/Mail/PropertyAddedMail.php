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

class PropertyAddedMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $property;
    public $vendor;

    public function __construct(PropertyMaster $property, User $vendor)
    {
        $this->property = $property;
        $this->vendor = $vendor;
    }

    public function build()
    {
        return $this->subject('New Property Added - ' . ($this->property->Name ?? ''))
                    ->view('emails.property_added')
                    ->with([
                        'property' => $this->property,
                        'vendor' => $this->vendor,
                    ]);
    }
}
