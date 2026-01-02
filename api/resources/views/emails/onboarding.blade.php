<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; text-decoration: none; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://resortwala.com/assets/logo.png" alt="ResortWala" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 10px;">ResortWala</div>
        </div>
        
        <h2>Hello, {{ $name }}!</h2>
        <p>You have been registered as a <strong>{{ ucfirst($role) }}</strong> on ResortWala.</p>
        <p>To access your account and start using the platform, please click the button below to set your secure password:</p>
        
        <div style="text-align: center;">
            <a href="{{ $onboardingUrl }}" class="btn">Verify & Login</a>
        </div>
        
        <p style="margin-top: 30px;">This link will expire in 24 hours. If you did not expect this email, please ignore it.</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} Resortwala. All rights reserved.
        </div>
    </div>
</body>
</html>
