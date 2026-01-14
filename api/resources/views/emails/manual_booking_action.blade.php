@extends('emails.layouts.main')

@section('content')
    @if($status === 'received')
        <h2 style="text-align: center;">New Manual Request 📩</h2>
        <p style="text-align: center;">A client has requested a booking via WhatsApp/Manual link.</p>
    @elseif($status === 'approved')
        <h2 style="text-align: center; color: #166534;">Request Approved ✅</h2>
        <p style="text-align: center;">You have successfully approved the manual booking request.</p>
    @elseif($status === 'rejected')
        <h2 style="text-align: center; color: #991b1b;">Request Rejected 🚫</h2>
        <p style="text-align: center;">The manual booking request has been rejected.</p>
    @endif

    @if(isset($booking))
        <div class="info-table">
           <table style="width: 100%;">
                <tr>
                    <th>Guest Name:</th>
                    <td>{{ $booking->CustomerName ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <th>Dates:</th>
                    <td>{{ \Carbon\Carbon::parse($booking->CheckInDate)->format('d M') }} - {{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('d M') }}</td>
                </tr>
           </table>
        </div>
    @endif

    <div style="text-align: center; margin-top: 30px;">
        <a href="http://72.61.242.42/vendor/calendar" class="btn">View In Calendar</a>
    </div>
@endsection
