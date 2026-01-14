@extends('emails.layouts.main')

@section('content')
    <h2 style="color: #111827; margin-top: 0; text-align: center;">Refund Initiated 💸</h2>
    
    <p style="text-align: center; color: #4b5563;">
        We have initiated a refund for your booking/transaction.
    </p>

    <div class="info-table">
        <table style="width: 100%;">
            <tr>
                <th>Reference ID:</th>
                <td>{{ $booking->booking_reference ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Refund Amount:</th>
                <td style="font-weight: bold; color: #166534;">₹{{ $amount }}</td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; font-size: 14px; color: #6b7280; margin-top: 24px;">
        It usually takes 5-7 business days for the amount to reflect in your original payment source.
    </p>

    <div style="text-align: center; margin-top: 32px;">
        <a href="https://resortwala.com/support" class="btn">Contact Support</a>
    </div>
@endsection
