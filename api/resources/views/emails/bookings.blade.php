@extends('emails.layouts.main')

@section('content')
    <div style="text-align: center; margin-bottom: 30px;">
        @if($type === 'new_request_vendor')
            <h2 style="margin: 0; color: #111827;">New Booking Request 🔔</h2>
            <p style="color: #6b7280; margin-top: 8px;">A customer has requested a stay at your property.</p>
        @elseif($type === 'confirmed_customer')
            <h2 style="margin: 0; color: #166534;">Booking Confirmed! 🎉</h2>
            <p style="color: #6b7280; margin-top: 8px;">Pack your bags, your stay is secured.</p>
        @elseif($type === 'status_update_customer')
            <h2 style="margin: 0; color: #111827;">Booking Update 📝</h2>
            <p style="color: #6b7280; margin-top: 8px;">There is an update regarding your reservation.</p>
        @else
            <h2 style="margin: 0; color: #111827;">Booking Notification</h2>
        @endif
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Booking Reference</div>
            <div style="font-size: 24px; font-weight: 800; color: #1f2937; margin-top: 4px;">{{ $booking->booking_reference ?? ('#' . $booking->BookingId) }}</div>
            <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-top: 12px; text-transform: uppercase;">
                {{ $booking->Status }}
            </div>
        </div>

        <table class="info-table">
            <tr>
                <td class="label">Property</td>
                <td class="value">{{ $booking->property->Name ?? 'Unknown Property' }}</td>
            </tr>
            <tr>
                <td class="label">Location</td>
                <td class="value">{{ $booking->property->Location ?? 'Lonavala' }}</td>
            </tr>
            <tr>
                <td class="label">Check-in</td>
                <td class="value">{{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d, Y') }}</td>
            </tr>
            <tr>
                <td class="label">Check-out</td>
                <td class="value">{{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('D, M d, Y') }}</td>
            </tr>
            <tr>
                <td class="label">Guests</td>
                <td class="value">{{ $booking->Guests }} Adults</td>
            </tr>
            <tr>
                <td class="label">Total Amount</td>
                <td class="value" style="font-size: 16px; color: #2563eb;">₹{{ number_format($booking->TotalAmount) }}</td>
            </tr>
        </table>
    </div>

    <div style="text-align: center;">
        @if($type === 'new_request_vendor')
            <a href="https://vendor.resortwala.com/calendar" class="btn">Review Request</a>
        @elseif($type === 'confirmed_customer')
            <a href="https://resortwala.com/bookings" class="btn">Manage Booking</a>
        @else
            <a href="https://resortwala.com" class="btn">View Details</a>
        @endif
    </div>
@endsection
