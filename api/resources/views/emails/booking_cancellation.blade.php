@extends('emails.layouts.main')

@section('content')
    @if($recipientType === 'customer')
        <h2 style="text-align: center; color: #991b1b;">Booking Cancelled 🛑</h2>
        <p style="text-align: center;">Your booking has been successfully cancelled as per your request.</p>
    @else
        <h2 style="text-align: center; color: #991b1b;">Booking Cancelled Alert ⚠️</h2>
        <p style="text-align: center;">A booking has been cancelled.</p>
    @endif

    <div class="info-table">
        <table style="width: 100%;">
            <tr>
                <th>Property:</th>
                <td>{{ $booking->property->Name ?? 'Unknown' }}</td>
            </tr>
            <tr>
                <th>Dates:</th>
                <td>{{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d') }} - {{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('D, M d') }}</td>
            </tr>
            <tr>
                <th>Reference:</th>
                <td>{{ $booking->booking_reference ?? ('#' . $booking->BookingId) }}</td>
            </tr>
        </table>
    </div>

    @if($recipientType === 'customer')
        <p style="text-align: center; font-size: 14px; color: #6b7280;">
            If you are eligible for a refund, it will be processed within 5-7 business days. 
            You will receive a separate email once the refund is initiated.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://resortwala.com/bookings" class="btn">Book Another Stay</a>
        </div>
    @elseif($recipientType === 'vendor')
        <div style="text-align: center; margin-top: 30px;">
            <a href="http://72.61.242.42/vendor/calendar" class="btn">Check Calendar</a>
        </div>
    @endif
@endsection
