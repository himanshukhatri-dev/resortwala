@extends('emails.layouts.main')

@section('content')
    <div style="text-align: center;">
        <h2 style="margin: 0; color: #111827;">Your Stay Starts Tomorrow! 📅</h2>
        <p style="color: #6b7280; margin-top: 8px;">We are excited to host you at <strong style="color: #1f2937;">{{ $booking->property->Name ?? 'ResortWala Property' }}</strong>.</p>
    </div>
    
    <table class="info-table">
        <tr>
            <td class="label">Check-in</td>
            <td class="value">{{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d, Y') }} (12:00 PM)</td>
        </tr>
        <tr>
            <td class="label">Guests</td>
            <td class="value">{{ $booking->Guests }} Adults</td>
        </tr>
        <tr>
            <td class="label">Location</td>
            <td class="value">
                <a href="https://maps.google.com/?q={{ urlencode($booking->property->Location ?? '') }}" style="color: #2563eb; text-decoration: none;">View Map 📍</a>
            </td>
        </tr>
    </table>

    <div style="background-color: #fefce8; border: 1px solid #fde047; padding: 16px; border-radius: 12px; margin: 24px 0; color: #854d0e; font-size: 14px; text-align: center;">
        <strong>Id Proof Policy:</strong> Please carry valid Govt ID proof for all guests (Aadhar/Passport). <br><em>Pan Card is not accepted.</em>
    </div>

    <div style="text-align: center; margin-top: 30px;">
        <a href="https://resortwala.com/bookings" class="btn">View Booking</a>
    </div>
@endsection
