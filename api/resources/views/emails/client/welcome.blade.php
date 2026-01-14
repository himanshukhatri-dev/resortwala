@extends('emails.layouts.main')

@section('content')
    <div style="text-align: center;">
        <h2 style="margin: 0; color: #111827;">Welcome to ResortWala! 🌴</h2>
        <p style="color: #6b7280; margin-top: 16px; font-size: 16px;">
            Hi <strong>{{ $name }}</strong>,<br>
            Thank you for joining our community. You are now all set to book your dream stays and waterpark adventures.
        </p>

        <img src="https://img.freepik.com/premium-vector/travel-vacation-concept-illustration_113065-274.jpg" alt="Welcome" style="max-width: 200px; margin: 20px auto; border-radius: 12px; display: block;" />

        <a href="https://resortwala.com" class="btn">Explore Destinations</a>

        <div class="divider"></div>

        <p style="font-size: 13px; color: #9ca3af;">
            Need help planning? Call our support or chat with us on WhatsApp.
        </p>
    </div>
@endsection
