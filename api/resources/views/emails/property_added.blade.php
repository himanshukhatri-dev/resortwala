<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }
        .content { padding: 20px; }
        .footer { font-size: 0.9em; color: #777; text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
        .property-details { margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Property Added!</h2>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new property has been added by <strong>{{ $vendor->name }}</strong> ({{ $vendor->email }}) and is waiting for your approval.</p>
            
            <div class="property-details">
                <h3>Property Details:</h3>
                <p><strong>Name:</strong> {{ $property->Name }}</p>
                <p><strong>Location:</strong> {{ $property->Location }}</p>
                <p><strong>Type:</strong> {{ $property->PropertyType }}</p>
                <p><strong>Price:</strong> {{ $property->Price }}</p>
            </div>

            <p>Please review the property and approve/reject it.</p>
            
            <p style="text-align: center;">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/admin/properties/pending" class="button" style="color: #ffffff;">Review Property</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} ResortWala. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
