@extends('emails.layouts.main')

@section('content')
    @if($status === 'submitted')
        <h2 style="text-align: center;">Edit Request Submitted 📝</h2>
        <p style="text-align: center;">We have received your changes for "<strong>{{ $property->Name }}</strong>". We will review them shortly.</p>
    @elseif($status === 'approved')
        <h2 style="text-align: center; color: #166534;">Edits Approved ✅</h2>
        <p style="text-align: center;">Your changes for "<strong>{{ $property->Name }}</strong>" are now live.</p>
    @elseif($status === 'rejected')
        <h2 style="text-align: center; color: #991b1b;">Edits Rejected ❌</h2>
        <p style="text-align: center;">The requested changes for "<strong>{{ $property->Name }}</strong>" could not be approved at this time.</p>
    @endif

    <div style="text-align: center; margin-top: 30px;">
        <a href="http://72.61.242.42/vendor/properties" class="btn">View Property</a>
    </div>
@endsection
