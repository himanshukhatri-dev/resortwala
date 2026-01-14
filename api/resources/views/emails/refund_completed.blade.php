@extends('emails.layouts.main')

@section('content')
    <h2 style="color: #111827; margin-top: 0; text-align: center;">Refund Completed ✅</h2>
    
    <p style="text-align: center; color: #4b5563;">
        Your refund has been successfully processed.
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
            @if(isset($transactionId))
            <tr>
                <th>Transaction ID:</th>
                <td>{{ $transactionId }}</td>
            </tr>
            @endif
        </table>
    </div>

    <p style="text-align: center; text-size: 14px; color: #6b7280; margin-top: 20px;">
        Please check your bank statement. If you don't see the credit within 24 hours, contact your bank with the Transaction ID above.
    </p>
@endsection
