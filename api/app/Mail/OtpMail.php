<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
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
        return $this->subject($this->title . ' - ResortWala')
                    ->html("
                        <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f4f4f4;'>
                            <div style='background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;'>
                                <h2 style='color: #008080;'>ResortWala</h2>
                                <h3 style='color: #333;'>{$this->title}</h3>
                                <p style='color: #666; font-size: 16px;'>{$this->messageText}</p>
                                <div style='font-size: 32px; font-weight: bold; color: #008080; margin: 20px 0; letter-spacing: 5px;'>
                                    {$this->otp}
                                </div>
                                <p style='color: #888; font-size: 12px;'>If you did not request this, please ignore this email.</p>
                            </div>
                        </div>
                    ");
    }
}
