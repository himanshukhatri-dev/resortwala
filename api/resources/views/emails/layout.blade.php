<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
        }

        .wrapper {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #3b82f6;
        }

        .logo {
            height: 50px;
            width: auto;
        }

        .tagline {
            color: #64748b;
            font-size: 12px;
            margin-top: 5px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .content {
            padding: 30px;
        }

        .footer {
            background-color: #1e293b;
            color: #94a3b8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }

        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }

        .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 15px;
            font-weight: bold;
        }

        @media only screen and (max-width: 600px) {
            .wrapper {
                margin: 0;
                border-radius: 0;
            }

            .content {
                padding: 20px;
            }
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="header">
            <!-- PHASE 1: Central Logo Implementation -->
            <img src="{{ asset('resortwala-logo.png') }}" alt="ResortWala" class="logo">
            <div class="tagline">Your Gateway to Fun</div>
        </div>

        <div class="content">
            <!-- PHASE 2: Dynamic Content Slot -->
            {!! $content !!}
        </div>

        <div class="footer">
            <p style="margin-bottom: 10px; color: #fff; font-weight: bold;">Team ResortWala</p>
            <p>
                <a href="{{ config('app.url') }}">www.resortwala.com</a> |
                <a href="mailto:support@resortwala.com">support@resortwala.com</a>
            </p>
            <p>Phone: +91-9136276555</p>

            @if(config('app.env') !== 'production')
                <div
                    style="margin-top: 15px; background: #334155; padding: 5px; border-radius: 4px; display: inline-block;">
                    Environment: <strong style="color: #fbbf24;">{{ strtoupper(config('app.env')) }}</strong>
                </div>
            @endif
        </div>
    </div>
</body>

</html>