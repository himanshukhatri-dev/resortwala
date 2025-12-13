<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;

    /**
     * Create a new message instance.
     *
     * @param string $otp
     * @return void
     */
    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Reset Password OTP - ResortWala')
                    ->html("
                        <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f4f4f4;'>
                            <div style='background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;'>
                                <h2 style='color: #008080;'>ResortWala</h2>
                                <h3 style='color: #333;'>Password Reset Request</h3>
                                <p style='color: #666; font-size: 16px;'>Use the One-Time Password (OTP) below to reset your password. This OTP is valid for 10 minutes.</p>
                                <div style='font-size: 32px; font-weight: bold; color: #008080; margin: 20px 0; letter-spacing: 5px;'>
                                    {$this->otp}
                                </div>
                                <p style='color: #888; font-size: 12px;'>If you did not request a password reset, please ignore this email.</p>
                            </div>
                        </div>
                    ");
    }
}
