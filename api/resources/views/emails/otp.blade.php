@extends('emails.layouts.main')

@section('content')
    <div style="text-align: center;">
        <h2 style="margin: 0; color: #111827;">{{ $title }} 🔐</h2>
        
        <p style="color: #6b7280; margin-top: 8px;">{{ $messageText }}</p>

        <div class="otp-box">
            {{ $otp }}
        </div>

        <p style="font-size: 14px; color: #ef4444; font-weight: 500;">
            This code expires in 10 minutes. <br>
            <span style="color: #9ca3af; font-weight: normal;">Do not share this code with anyone.</span>
        </p>

        <a href="https://resortwala.com" class="btn">Go to ResortWala</a>
    </div>
@endsection
