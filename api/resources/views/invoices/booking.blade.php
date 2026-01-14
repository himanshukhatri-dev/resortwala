<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $booking->booking_reference }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 14px;
            color: #333;
            line-height: 1.4;
        }
        .container {
            width: 100%;
            margin: 0 auto;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #eee;
            margin-bottom: 20px;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        .invoice-title {
            float: right;
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            font-size: 24px;
            color: #666;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .meta-table td {
            vertical-align: top;
        }
        .bill-to {
            width: 50%;
        }
        .ship-to {
            width: 50%;
            text-align: right;
        }
        .table-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .table-items th {
            background: #f9f9f9;
            padding: 10px;
            border-bottom: 2px solid #ddd;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #777;
        }
        .table-items td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .total-section {
            width: 100%;
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            font-size: 10px;
            color: #999;
            text-align: center;
        }
        .status-badge {
            background: #eefbf0;
            color: #1a7f37;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        .cancelled {
            background: #ffeeee;
            color: #c00;
        }
        .pending {
            background: #fff8e1;
            color: #b7791f;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 50%;">
                        <div class="logo">ResortWala</div>
                        <div>{{ $company['address'] }}</div>
                        <div>GST: {{ $company['gst'] }}</div>
                        <div>Support: {{ $company['support'] }}</div>
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <div class="invoice-title">
                            <h1>TAX INVOICE</h1>
                            <div><strong>Ref:</strong> {{ $booking->booking_reference }}</div>
                            <div><strong>Date:</strong> {{ $date }}</div>
                            <div><strong>Invoice #:</strong> {{ $invoice_no }}</div>
                            <div style="margin-top: 5px;">
                                @if($booking->Status == 'Confirmed')
                                    <span class="status-badge">PAID</span>
                                @elseif($booking->Status == 'Cancelled')
                                    <span class="status-badge cancelled">CANCELLED</span>
                                @else
                                    <span class="status-badge pending">PENDING</span>
                                @endif
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Billing Info -->
        <table class="meta-table">
            <tr>
                <td class="bill-to">
                    <strong>Billed To:</strong><br>
                    {{ $booking->CustomerName }}<br>
                    {{ $booking->CustomerMobile }}<br>
                    {{ $booking->CustomerEmail }}
                </td>
                <td class="ship-to">
                    <strong>Fulfilling Property:</strong><br>
                    {{ $property->Name }}<br>
                    {{ $property->Location }}<br>
                    @if(!empty($property->gst_number))
                        GST: {{ $property->gst_number }}
                    @endif
                </td>
            </tr>
        </table>

        <!-- Line Items -->
        <table class="table-items">
            <thead>
                <tr>
                    <th style="width: 50%;">Description</th>
                    <th style="width: 15%; text-align: center;">Guests</th>
                    <th style="width: 15%; text-align: center;">Nights</th>
                    <th style="width: 20%; text-align: right;">Amount (INR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Accommodation - {{ $property->Name }}</strong><br>
                        <span style="color: #666; font-size: 12px;">
                            Check-In: {{ \Carbon\Carbon::parse($booking->CheckInDate)->format('d M Y') }}<br>
                            Check-Out: {{ \Carbon\Carbon::parse($booking->CheckOutDate)->format('d M Y') }}
                        </span>
                    </td>
                    <td style="text-align: center;">{{ $booking->Guests }}</td>
                    <td style="text-align: center;">
                        {{ \Carbon\Carbon::parse($booking->CheckInDate)->diffInDays(\Carbon\Carbon::parse($booking->CheckOutDate)) }}
                    </td>
                    <td style="text-align: right;">
                        {{ number_format($booking->base_amount ?? $booking->TotalAmount, 2) }}
                    </td>
                </tr>

                @if($booking->tax_amount > 0)
                <tr>
                    <td>GST / Taxes</td>
                    <td colspan="2"></td>
                    <td style="text-align: right;">{{ number_format($booking->tax_amount, 2) }}</td>
                </tr>
                @endif
                
                @if($booking->discount_amount > 0)
                <tr>
                    <td style="color: green;">Discount (Coupon: {{ $booking->coupon_code }})</td>
                    <td colspan="2"></td>
                    <td style="text-align: right; color: green;">- {{ number_format($booking->discount_amount, 2) }}</td>
                </tr>
                @endif
            </tbody>
        </table>

        <!-- Totals -->
        <div class="total-section">
            <table align="right" style="width: 40%; border-collapse: collapse;">
                <tr class="total-row">
                    <td style="padding: 10px; border-top: 2px solid #333;">Total Paid:</td>
                    <td style="padding: 10px; border-top: 2px solid #333; text-align: right;">₹ {{ number_format($booking->TotalAmount, 2) }}</td>
                </tr>
            </table>
            <div style="clear: both;"></div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>ResortWala Services Pvt Ltd. • Terms & Conditions Apply</p>
        </div>
    </div>
</body>
</html>
