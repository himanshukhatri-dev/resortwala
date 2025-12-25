<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { width: 100%; background-color: #f4f4f4; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 3px solid #000; }
        .header img { height: 50px; }
        .hero { background-color: #f8f9fa; padding: 40px 30px; text-align: center; border-bottom: 1px solid #eee; }
        .hero h1 { margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700; }
        .hero p { margin: 10px 0 0; color: #666; font-size: 16px; }
        .content { padding: 30px; }
        .details-box { background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .value { font-size: 16px; color: #333; font-weight: 600; margin-bottom: 15px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #000; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 99px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .status-pending { background: #fef9c3; color: #854d0e; }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <img src="http://staging.resortwala.com/resortwala-logo.png" alt="ResortWala">
            </div>

            <div class="hero">
                @if($type === 'request_submitted')
                    <h1>Property Edit Request</h1>
                    <p>A vendor has requested changes to their property.</p>
                @elseif($type === 'request_approved')
                    <h1 style="color: #166534;">Changes Approved</h1>
                    <p>Your property edit request has been approved and is now live.</p>
                @elseif($type === 'request_rejected')
                    <h1 style="color: #991b1b;">Changes Rejected</h1>
                    <p>Your property edit request was rejected by the admin.</p>
                @endif
            </div>

            <div class="content">
                <div class="details-box">
                    <div class="label">Property Name</div>
                    <div class="value">{{ $property->Name }}</div>

                    <div class="label">Vendor</div>
                    <div class="value">{{ $vendor->name ?? 'Unknown' }}</div>
                    
                    <div class="label">Status</div>
                    <div>
                        @if($type === 'request_submitted')
                            <span class="status-badge status-pending">Pending Review</span>
                        @elseif($type === 'request_approved')
                            <span class="status-badge status-approved">Approved</span>
                        @elseif($type === 'request_rejected')
                            <span class="status-badge status-rejected">Rejected</span>
                        @endif
                    </div>
                </div>

                @if($type === 'request_submitted')
                    <p style="text-align: center;">
                        <a href="http://stagingadmin.resortwala.com/property-changes/{{ $requestId ?? '' }}" class="btn">Review Changes</a>
                    </p>
                @else
                    <p style="text-align: center;">
                        <a href="http://stagingvendor.resortwala.com/vendor/properties" class="btn">View Property</a>
                    </p>
                @endif
            </div>

            <div class="footer">
                &copy; {{ date('Y') }} ResortWisdom. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
