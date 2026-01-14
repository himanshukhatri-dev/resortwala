@extends('emails.layouts.main')

@section('content')
    <h2 style="text-align: center;">Hello {{ $name }},</h2>

    @if(isset($status) && $status === 'approved')
        <h3 style="text-align: center; color: #166534;">Congratulations! Account Approved 🎉</h3>
        <p style="text-align: center;">Your vendor account has been verified and approved by our admin team.</p>
        <p style="text-align: center;">You can now login and start adding your properties.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://72.61.242.42/login" class="btn">Login to Dashboard</a>
        </div>

    @elseif(isset($status) && $status === 'rejected')
        <h3 style="text-align: center; color: #991b1b;">Account Application Update</h3>
        <p style="text-align: center;">We regret to inform you that your vendor application could not be approved at this time.</p>
        <p style="text-align: center;">Please contact support for more details.</p>

    @else
        <!-- Default Welcome -->
        <h3 style="text-align: center;">Welcome to ResortWala!</h3>
        <p style="text-align: center;">Thank you for registering. Please complete your profile to start listing properties.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $onboardingUrl }}" class="btn">Complete Onboarding</a>
        </div>
    @endif
    
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 20px;">
        We are excited to have you on board!
    </p>
@endsection
