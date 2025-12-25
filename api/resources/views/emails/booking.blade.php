<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f4f4f4; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 3px solid #000; }
        .header img { height: 50px; }
        .hero { background-color: #f8f9fa; padding: 40px 30px; text-align: center; border-bottom: 1px solid #eee; }
        .hero h1 { margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700; }
        .hero p { margin: 10px 0 0; color: #666; font-size: 16px; }
        .booking-ref { margin-top: 20px; display: inline-block; background: #000; color: #fff; padding: 8px 16px; border-radius: 4px; font-family: monospace; font-size: 18px; letter-spacing: 1px; }
        .content { padding: 30px; }
        .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .grid { display: block; width: 100%; margin-bottom: 30px; }
        .row { display: table; width: 100%; margin-bottom: 15px; }
        .col { display: table-cell; vertical-align: top; width: 50%; padding-right: 10px; }
        .label { font-size: 12px; color: #888; margin-bottom: 4px; }
        .value { font-size: 16px; color: #333; font-weight: 500; }
        .total-box { background-color: #f9f9f9; padding: 20px; border-radius: 6px; text-align: right; }
        .total-label { font-size: 14px; color: #666; }
        .total-price { font-size: 24px; color: #000; font-weight: 700; margin-top: 5px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #FF385C; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .status-confirmed { color: #166534; background: #dcfce7; padding: 4px 8px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header with Logo -->
            <div class="header">
                <img src="http://staging.resortwala.com/resortwala-logo.png" alt="ResortWala" />
            </div>

            <!-- Hero Section -->
            <div class="hero">
                @if($type === 'new_request_vendor')
                    <h1>New Booking Request</h1>
                    <p>A customer has requested a stay at your property.</p>
                @elseif($type === 'current_request_admin')
                    <h1>New Booking Alert</h1>
                    <p>Admin Copy</p>
                @elseif($type === 'status_update_customer')
                    <h1>Booking Status Update</h1>
                    <p>Your booking status has changed to <strong>{{ $booking->Status }}</strong>.</p>
                @elseif($type === 'confirmed_customer')
                    <h1 style="color: #166534;">Booking Confirmed!</h1>
                    <p>Your reservation is set. We can't wait to host you!</p>
                @endif
                
                <div class="booking-ref">{{ $booking->booking_reference ?? ('#' . $booking->BookingId) }}</div>
            </div>

            <!-- Booking Details -->
            <div class="content">
                <div class="section-title">Property Details</div>
                <div class="grid">
                    <div class="row">
                        <div class="col" style="width: 100%;">
                            <div class="value" style="font-size: 20px;">{{ $booking->property->Name ?? 'Unknown Property' }}</div>
                            <div class="label">{{ $booking->property->Location ?? '' }}</div>
                            <div style="margin-top: 10px;">
                                <a href="https://maps.google.com/?q={{ urlencode($booking->property->Location ?? '') }}" style="color: #007bff; text-decoration: none; font-size: 14px;">📍 View on Map</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section-title">Reservation Info</div>
                <div class="grid">
                    <div class="row">
                        <div class="col">
                            <div class="label">CHECK-IN</div>
                            <div class="value">{{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d, Y') }}</div>
                            <div class="label" style="font-size: 11px;">2:00 PM</div>
                        </div>
                        <div class="col">
                            <div class="label">CHECK-OUT</div>
                            <div class="value">{{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('D, M d, Y') }}</div>
                            <div class="label" style="font-size: 11px;">11:00 AM</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="label">GUESTS</div>
                            <div class="value">{{ $booking->Guests }} Adults</div>
                        </div>
                        <div class="col">
                            <div class="label">STATUS</div>
                            <div class="value"><span class="status-confirmed">{{ strtoupper($booking->Status) }}</span></div>
                        </div>
                    </div>
                </div>

                <div class="section-title">Payment Summary</div>
                <div class="total-box">
                    <div class="total-label">Total Amount Paid</div>
                    <div class="total-price">₹{{ number_format($booking->TotalAmount) }}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 5px;">(Includes taxes & fees)</div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://staging.resortwala.com/bookings" class="btn">Manage My Booking</a>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>Need help? Contact us at support@resortwala.com or <a href="#" style="color: #666;">WhatsApp us</a>.</p>
                <p>&copy; {{ date('Y') }} ResortWala. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 40px; color: #374151; }
        .info-box { background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: bold; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-confirmed { background-color: #dcfce7; color: #166534; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .footer { background-color: #f3f4f6; color: #6b7280; text-align: center; padding: 20px; font-size: 12px; }
        .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
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
                <p>You have received a new booking request for your property.</p>
                <a href="http://72.61.242.42/vendor/calendar" class="button">View & Approve in Calendar</a>
            @elseif($type === 'current_request_admin')
                <h2>New Booking Request (Admin Copy)</h2>
                <p>A new request has been placed.</p>
            @elseif($type === 'status_update_customer')
                <h2>Booking Status Update 📝</h2>
                <p>The status of your booking request has changed.</p>
            @elseif($type === 'confirmed_customer')
                <h2>Booking Confirmed! 🎉</h2>
                <p>Your stay is confirmed. We look forward to hosting you!</p>
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

                <div class="label">Mobile</div>
                <div class="value">{{ $booking->CustomerMobile }}</div>

                <div class="label">Dates</div>
                <div class="value">
                    {{ \Carbon\Carbon::parse($booking->CheckInDate)->format('D, M d') }} - 
                    {{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('D, M d') }}
                </div>

                <div class="label">Guests</div>
                <div class="value">{{ $booking->Guests }}</div>

                <div class="label">Total Amount</div>
                <div class="value">₹{{ $booking->TotalAmount }}</div>
            </div>

            <p>If you have any questions, please contact us on WhatsApp.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ResortWala. All rights reserved.
        </div>
    </div>
</body>
</html>
