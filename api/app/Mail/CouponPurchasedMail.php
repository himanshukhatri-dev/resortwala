<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class CouponPurchasedMail extends BaseMailable
{
    use Queueable, SerializesModels;

    public $coupon;
    public $purchasedCoupon;

    public function __construct($purchasedCoupon)
    {
        $this->purchasedCoupon = $purchasedCoupon;
        // Assuming relationship or separate Coupon object passed, distinct logic can be added
        // For now using the purchased wrapper which likely contains code/details
    }

    public function build()
    {
        return $this->subject('Coupon Purchased - ' . ($this->purchasedCoupon->code ?? 'ResortWala'))
                    ->view('emails.coupon_purchased');
    }
}
