<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

abstract class BaseMailable extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // This method should be overridden by child classes, 
        // but we can enforce the subject prefix here if called at the end
        return $this;
    }

    /**
     * Override the subject method to append the environment prefix.
     *
     * @param  string  $subject
     * @return $this
     */
    public function subject($subject)
    {
        $prefix = $this->getSubjectPrefix();
        return parent::subject($prefix . ' ' . $subject);
    }

    /**
     * Get the subject prefix based on the environment.
     *
     * @return string
     */
    protected function getSubjectPrefix()
    {
        $env = app()->environment();

        if ($env === 'production') {
            return '[RESORTWALA-PROD]';
        }

        return '[RESORTWALA-STAGING]'; // Covers local and staging
    }
}
