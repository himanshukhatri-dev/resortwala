@extends('emails.layouts.main')

@section('content')
    @if($updateType === 'holiday_price')
        <h2 style="text-align: center;">Holiday Price Updated 📅</h2>
        <p style="text-align: center;">Pricing for specific holiday dates has been updated for "<strong>{{ $property->Name }}</strong>".</p>
    @elseif($updateType === 'freeze')
        <h2 style="text-align: center; color: #d97706;">Dates Frozen ❄️</h2>
        <p style="text-align: center;">Certain dates for "<strong>{{ $property->Name }}</strong>" have been marked as unavailable.</p>
    @elseif($updateType === 'unfreeze')
        <h2 style="text-align: center; color: #166534;">Dates Are Now Available ☀️</h2>
        <p style="text-align: center;">Previously frozen dates for "<strong>{{ $property->Name }}</strong>" are now open for booking.</p>
    @endif

    @if(!empty($details))
        <div class="info-table">
            <table style="width: 100%;">
                @foreach($details as $key => $value)
                <tr>
                    <th>{{ ucfirst(str_replace('_', ' ', $key)) }}:</th>
                    <td>{{ is_array($value) ? implode(', ', $value) : $value }}</td>
                </tr>
                @endforeach
            </table>
        </div>
    @endif

    <div style="text-align: center; margin-top: 30px;">
        <a href="http://72.61.242.42/vendor/calendar" class="btn">Manage Calendar</a>
    </div>
@endsection
