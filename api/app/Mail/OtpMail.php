<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $title;
    public $messageText;

    /**
     * Create a new message instance.
     *
     * @param string $otp
     * @param string $type
     * @return void
     */
    public function __construct($otp, $type = 'login')
    {
        $this->otp = $otp;
        
        if ($type === 'reset') {
            $this->title = 'Password Reset Request';
            $this->messageText = 'Use the One-Time Password (OTP) below to reset your password. This OTP is valid for 10 minutes.';
        } else if ($type === 'signup') {
            $this->title = 'Verify Your Email';
            $this->messageText = 'Welcome to ResortWala! Use the One-Time Password (OTP) below to complete your registration.';
        } else if ($type === 'vendor_registration') {
            $this->title = 'Vendor Registration';
            $this->messageText = 'Welcome to ResortWala Vendor Portal! Use the One-Time Password (OTP) below to complete your registration. This OTP is valid for 5 minutes.';
        } else if ($type === 'verification') {
            $this->title = 'Email Verification';
            $this->messageText = 'Use the One-Time Password (OTP) below to verify your email address. This OTP is valid for 10 minutes.';
        } else if ($type === 'phone_verification') {
            $this->title = 'Phone Verification';
            $this->messageText = 'Use the One-Time Password (OTP) below to verify your phone number. This OTP is valid for 10 minutes.';
        } else {
            $this->title = 'Login Verification';
            $this->messageText = 'Use the One-Time Password (OTP) below to securely log into your account.';
        }
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // Parent build() ensures subject prefixing if called, but we override subject() anyway
        return $this->subject($this->title) // Prefix is added automatically by BaseMailable
                    ->view('emails.otp');
    }
}
