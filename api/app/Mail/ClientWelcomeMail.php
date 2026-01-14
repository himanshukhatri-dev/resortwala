<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class ClientWelcomeMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $name;

    public function __construct($name)
    {
        $this->name = $name;
    }

    public function build()
    {
        return $this->subject('Welcome to ResortWala! 🌴')
                    ->view('emails.client.welcome');
    }
}
