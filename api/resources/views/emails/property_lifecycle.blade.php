@extends('emails.layouts.main')

@section('content')
    @if(isset($action) && $action === 'approved')
        <h2 style="text-align: center; color: #166534;">Property Approved! 🎉</h2>
        <p style="text-align: center;">Your property "<strong>{{ $property->Name }}</strong>" is now live on ResortWala.</p>
    @elseif(isset($action) && $action === 'rejected')
        <h2 style="text-align: center; color: #991b1b;">Property Rejected 🚫</h2>
        <p style="text-align: center;">Unfortunately, your property "<strong>{{ $property->Name }}</strong>" was not approved.</p>
        @if(!empty($reason))
            <div style="background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <strong>Reason:</strong> {{ $reason }}
            </div>
        @endif
    @elseif(isset($action) && $action === 'deleted')
        <h2 style="text-align: center; color: #666;">Property Deleted 🗑️</h2>
        <p style="text-align: center;">Your property "<strong>{{ $property->Name }}</strong>" has been removed from our platform.</p>
    @else
        <h2 style="text-align: center;">Property Update 🏠</h2>
        <p style="text-align: center;">Update regarding "<strong>{{ $property->Name }}</strong>".</p>
    @endif

    <div style="text-align: center; margin-top: 30px;">
        <a href="http://72.61.242.42/vendor/properties" class="btn">View My Properties</a>
    </div>
@endsection
