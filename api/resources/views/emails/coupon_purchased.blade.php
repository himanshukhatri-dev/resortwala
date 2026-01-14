@extends('emails.layouts.main')

@section('content')
    <h2 style="color: #111827; margin-top: 0; text-align: center;">Coupon Purchased! 🎉</h2>
    
    <p style="text-align: center; color: #4b5563;">
        Thank you for your purchase. Your coupon is ready to be redeemed.
    </p>

    <div class="otp-box" style="font-size: 24px; letter-spacing: 2px;">
        {{ $purchasedCoupon->code ?? 'CODE-123' }}
    </div>

    <div class="info-table">
        <table style="width: 100%;">
            <tr>
                <th>Amount Paid:</th>
                <td>₹{{ $purchasedCoupon->amount_paid ?? '0.00' }}</td>
            </tr>
            <tr>
                <th>Valid Until:</th>
                <td>{{ \Carbon\Carbon::parse($purchasedCoupon->valid_until ?? now()->addDays(30))->format('d M, Y') }}</td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 20px;">
        Show this code at the resort check-in counter to redeem your offer.
    </p>

    <div style="text-align: center; margin-top: 32px;">
        <a href="https://resortwala.com/my-coupons" class="btn">View My Coupons</a>
    </div>
@endsection
