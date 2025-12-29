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
        return $this->subject($this->title . ' - ResortWala')
                    ->html("
                        <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f4f4f4;'>
                            <div style='background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;'>
                                <img src='https://resortwala.com/assets/logo.png' alt='ResortWala' style='max-width: 180px; height: auto; margin-bottom: 20px;' />
                                <h2 style='color: #2563eb; margin-top: 10px;'>ResortWala</h2>
                                <h3 style='color: #333;'>{$this->title}</h3>
                                <p style='color: #666; font-size: 16px;'>{$this->messageText}</p>
                                <div style='font-size: 32px; font-weight: bold; color: #2563eb; margin: 20px 0; letter-spacing: 5px; background: #eff6ff; padding: 20px; border-radius: 8px;'>
                                    {$this->otp}
                                </div>
                                <p style='color: #888; font-size: 12px;'>If you did not request this, please ignore this email.</p>
                                <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px;'>
                                    &copy; " . date('Y') . " ResortWala. All rights reserved.
                                </div>
                            </div>
                        </div>
                    ");
    }
}
