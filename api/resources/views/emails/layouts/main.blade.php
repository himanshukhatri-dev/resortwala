<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'ResortWala Notification' }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
        .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .logo { height: 50px; width: auto; }
        .content { padding: 40px 40px 20px 40px; color: #374151; font-size: 16px; line-height: 1.6; }
        .footer { padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; }
        .footer a { color: #6b7280; text-decoration: underline; }
        
        /* Typography */
        h1, h2, h3 { font-family: 'Playfair Display', serif; color: #111827; margin-top: 0; }
        p { margin-bottom: 20px; }
        strong { color: #111827; font-weight: 600; }
        
        /* Buttons - Gold/Amber Theme */
        .btn {
            display: inline-block;
            background-color: #D97706; /* Amber-600 */
            color: #ffffff !important;
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.4);
        }
        .btn:hover { background-color: #B45309; }

        /* Components */
        .otp-box {
            background-color: #fefff5; /* Very light amber/white tint */
            border: 2px dashed #D97706; /* Gold Dashes */
            color: #111827;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 0.25em;
            text-align: center;
            padding: 24px;
            margin: 24px 0;
            border-radius: 12px;
        }
        
        /* Utilities */
        .w-full { width: 100%; }
        .text-center { text-align: center; }
        .text-sm { font-size: 14px; }
        .text-gray { color: #6b7280; }
        
        /* Table Styles for Updates */
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .info-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
        .info-table tr:last-child td { border-bottom: none; }
        .info-table .label { color: #6b7280; font-weight: 500; width: 40%; background-color: #f9fafb; }
        .info-table .value { color: #111827; font-weight: 600; text-align: right; }

        @media only screen and (max-width: 600px) {
            .content { padding: 20px; }
            .btn { display: block; width: 100%; box-sizing: border-box; }
        }
    </style>
</head>
<body>
    <table class="wrapper" role="presentation">
        <tr>
            <td>
                <div style="height: 40px;"></div>
                <table class="main-table" role="presentation">
                    <!-- Header with Logo -->
                    <tr>
                        <td class="header">
                            <a href="https://www.resortwala.com">
                                <img src="https://resortwala.com/resortwala-logo.png" alt="ResortWala" class="logo">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="content">
                            @yield('content')
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                            <p style="margin-bottom: 10px;">
                                &copy; {{ date('Y') }} ResortWala. All rights reserved.<br>
                                Luxury Stays, Curated for You.
                            </p>
                            <p>
                                <a href="https://resortwala.com/contact">Contact Support</a> | 
                                <a href="https://resortwala.com/privacy">Privacy Policy</a>
                            </p>
                            @if(!app()->environment('production'))
                                <div style="margin-top: 10px; padding: 4px 8px; background: #fee2e2; color: #991b1b; display: inline-block; border-radius: 4px; font-size: 10px;">
                                    {{ strtoupper(app()->environment()) }} Environment
                                </div>
                            @endif
                        </td>
                    </tr>
                </table>
                <div style="height: 40px;"></div>
            </td>
        </tr>
    </table>
</body>
</html>
