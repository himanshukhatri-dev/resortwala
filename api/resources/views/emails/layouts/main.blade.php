<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResortWala</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-wrapper { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .logo { height: 40px; width: auto; }
        .env-badge { display: inline-block; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 999px; vertical-align: middle; margin-left: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
        .env-staging { background-color: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
        .env-prod { background-color: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .body { padding: 32px 24px; color: #374151; font-size: 16px; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .social-links { margin-bottom: 16px; }
        .social-link { display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; }
        .disclaimer { font-size: 11px; color: #9ca3af; margin-top: 12px; }
        
        /* Utility classes for content logs */
        .btn { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; margin: 16px 0; }
        .otp-box { background-color: #eff6ff; border: 1px dashed #bfdbfe; color: #1e40af; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 24px; margin: 24px 0; border-radius: 8px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        .info-table th { text-align: left; padding: 8px; color: #6b7280; font-weight: 600; width: 40%; }
        .info-table td { text-align: left; padding: 8px; color: #111827; }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
                <img src="https://resortwala.com/assets/logo.png" alt="ResortWala" class="logo">
                @if(app()->environment('local', 'staging'))
                    <span class="env-badge env-staging">STAGING Environment</span>
                @endif
            </div>

            <!-- Main Content -->
            <div class="body">
                @yield('content')
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>&copy; {{ date('Y') }} ResortWisdom Pvt Ltd. All rights reserved.</p>
                
                <div class="disclaimer">
                    This is an automated message from Resortwala.com 
                    <strong style="color: {{ app()->environment('production') ? '#166534' : '#d97706' }}">
                        [{{ strtoupper(app()->environment()) }} Environment]
                    </strong>
                    <br>
                    If you did not request this, please ignore this email.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
