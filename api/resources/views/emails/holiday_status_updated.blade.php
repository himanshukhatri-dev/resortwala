<!DOCTYPE html>
<html>
<head>
    <title>Holiday Rate Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Holiday Rate Update</h2>
        
        <p>Dear {{ $holiday->property->vendor->name ?? 'Vendor' }},</p>
        
        <p>This email is to inform you about the status update for your holiday rate submission.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Property:</strong> {{ $holiday->property->Name ?? 'N/A' }}</p>
            <p><strong>Holiday Name:</strong> {{ $holiday->name }}</p>
            <p><strong>Dates:</strong> {{ $holiday->from_date->format('M d, Y') }} - {{ $holiday->to_date->format('M d, Y') }}</p>
            <p><strong>Rate:</strong> ₹{{ $holiday->base_price }}</p>
            
            <p><strong>Status:</strong> 
                <span style="color: {{ $status == 'approved' ? 'green' : 'red' }}; font-weight: bold;">
                    {{ ucfirst($status) }}
                </span>
            </p>
            
            @if($reason)
                <p><strong>Reason/Feedback:</strong><br>
                {{ $reason }}</p>
            @endif
        </div>

        <p>If you have any questions, please contact the admin support team.</p>
        
        <p>Best regards,<br>Team ResortWala</p>
    </div>
</body>
</html>
