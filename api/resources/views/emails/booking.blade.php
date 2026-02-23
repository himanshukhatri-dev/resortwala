<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            margin-top: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #000000;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
        }

        .content {
            padding: 40px;
            color: #374151;
        }

        .info-box {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }

        .label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: bold;
        }

        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }

        .status-booked {
            background-color: #e0f2fe;
            color: #0369a1;
        }

        .status-confirmed {
            background-color: #dcfce7;
            color: #166534;
        }

        .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .footer {
            background-color: #f3f4f6;
            color: #6b7280;
            text-align: center;
            padding: 20px;
            font-size: 12px;
        }

        .button {
            display: inline-block;
            background-color: #000;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>ResortWala</h1>
        </div>
        <div class="content">
            @if($type === 'new_request_vendor')
                <h2>New Booking Request 🔔</h2>
                <p>You have received a new booking request for your property. Please review and confirm the availability.
                </p>
                <a href="{{ env('FRONTEND_URL', 'https://resortwala.com') }}/vendor/calendar" class="button">View & Approve
                    in Calendar</a>
            @elseif($type === 'payment_received_customer')
                <h2>Payment Received! ✅</h2>
                <p>We've received your payment. Your booking is now <strong>under confirmation</strong> by the resort. We
                    will notify you once they lock the slot.</p>
            @elseif($type === 'confirmed_customer')
                <h2 style="color: #166534;">Booking Confirmed! 🎉</h2>
                <p>Pack your bags! Your stay has been officially confirmed by the resort. We look forward to hosting you.
                </p>
            @elseif($type === 'rejected_customer')
                <h2 style="color: #991b1b;">Booking Update 📝</h2>
                <p>Unfortunately, the resort was unable to confirm your booking for the selected dates. Any payments made
                    will be refunded automatically.</p>
            @elseif($type === 'status_update_customer')
                <h2>Booking Status Update 📝</h2>
                <p>The status of your booking request has changed.</p>
            @endif

            <div class="info-box">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="status-badge status-{{ strtolower($booking->Status) }}">
                        {{ strtoupper($booking->Status) }}
                    </span>
                    <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                        Reference: <strong>{{ $booking->booking_reference ?? ('#' . $booking->BookingId) }}</strong>
                    </div>
                </div>

                <div class="label">Property</div>
                <div class="value">{{ $booking->property->Name ?? 'Unknown Property' }}</div>

                <div class="label">Guest Name</div>
                <div class="value">{{ $booking->CustomerName }}</div>

                @if($type === 'new_request_vendor')
                    <div class="label">Mobile</div>
                    <div class="value">{{ $booking->CustomerMobile }}</div>
                @endif

                <div class="label">Dates</div>
                <div class="value">
                    {{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d') }} -
                    {{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('D, M d') }}
                </div>

                <div class="label">Guests</div>
                <div class="value">{{ $booking->Guests }}</div>

                <div class="label">Total Amount</div>
                <div class="value">₹{{ number_format($booking->TotalAmount) }}</div>
            </div>

            <p>If you have any questions, please contact us on WhatsApp.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ResortWala. All rights reserved.
        </div>
    </div>
</body>

</html>