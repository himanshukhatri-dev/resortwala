<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Services\NotificationService;

class BookingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'PropertyId' => 'required|exists:property_masters,PropertyId',
            'CustomerName' => 'required|string|max:255',
            'CustomerMobile' => 'required|string|max:15',
            'CustomerEmail' => 'nullable|email',
            'CheckInDate' => 'required|date',
            'CheckOutDate' => 'required|date|after:CheckInDate',
            'Guests' => 'required|integer|min:1',
            // New Fields
            'coupon_code' => 'nullable|string',
            'discount_amount' => 'nullable|numeric',
            'tax_amount' => 'nullable|numeric',
            'base_amount' => 'nullable|numeric',
            'TotalAmount' => 'required|numeric',
            'payment_method' => 'required|string|in:hotel,card,upi',
            'SpecialRequest' => 'nullable|string',
            'booking_source' => 'nullable|string|in:customer_app,public_calendar,vendor_manual,admin_manual'
        ]);

        // Default booking source to customer_app if not provided
        $bookingSource = $validated['booking_source'] ?? 'customer_app';

        // Generate Booking Reference
        do {
            $ref = 'RES-' . strtoupper(\Illuminate\Support\Str::random(8));
        } while (Booking::where('booking_reference', $ref)->exists());
        $validated['booking_reference'] = $ref;
        
        // Get property to check type
        $property = \App\Models\PropertyMaster::find($validated['PropertyId']);
        
        // Check availability based on property type
        // Check availability logic
        $type = strtolower($property->property_type);
        $isWaterpark = ($type === 'waterpark' || $type === 'water park');

        if (!$isWaterpark) {
            // For villas/others, prevent overlap: (StartA < EndB) && (EndA > StartB)
            $existingBooking = Booking::where('PropertyId', $validated['PropertyId'])
                ->whereIn('Status', ['Confirmed', 'pending', 'locked', 'booked']) // Ensure all status checked
                ->where(function($q) use ($validated) {
                    $q->where('CheckInDate', '<', $validated['CheckOutDate'])
                      ->where('CheckOutDate', '>', $validated['CheckInDate']);
                })
                ->exists();
                
            if ($existingBooking) {
                return response()->json([
                    'message' => 'Property already booked for selected dates'
                ], 422);
            }
        }
        // For waterparks, allow multiple bookings

        // Set status based on booking source
        if ($bookingSource === 'public_calendar') {
            $validated['Status'] = 'Pending'; // Needs admin approval (User Request)
        } else {
            $validated['Status'] = 'Confirmed';   // Auto-confirm Vendor/Website bookings
        }
        
        $validated['booking_source'] = $bookingSource;
        // Initial payment status is always pending until callback confirms it
        $validated['payment_status'] = 'pending';

        $booking = Booking::create($validated);

        // Send confirmation notification
        $this->notificationService->sendBookingConfirmation($booking);

        return response()->json([
            'message' => 'Booking created successfully',
            'booking' => $booking,
            'requires_confirmation' => $bookingSource !== 'customer_app'
        ], 201);
    }
    public function search(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email',
            'mobile' => 'nullable|string'
        ]);

        $query = Booking::query()->with('property'); // Eager load property



        // Check for Email OR Mobile match (widest search)
        if ($request->email || $request->mobile) {
            $query->where(function($q) use ($request) {
                if ($request->email) $q->orWhere('CustomerEmail', $request->email);
                if ($request->mobile) $q->orWhere('CustomerMobile', $request->mobile);
            });
        } else {
            return response()->json([]);
        }

        return response()->json([
            'bookings' => $query->orderBy('created_at', 'desc')->get()
        ]);
    }
    public function cancel(Request $request, $id)
    {
        // Simple cancellation for now. 
        // In prod, check if request->email matches booking->CustomerEmail
        $booking = Booking::findOrFail($id);
        $booking->Status = 'Cancelled';
        $booking->save();

        return response()->json(['message' => 'Booking cancelled successfully', 'booking' => $booking]);
    }

    public function resendConfirmation($id)
    {
        $booking = Booking::with('property')->findOrFail($id);
        
        // Use existing logic for confirmation email (handles customer/vendor/admin notifications)
        // or specifically target customer. The prompt says "resend email", usually implying customer confirmation.
        // Let's force a customer confirmation email.
        
        try {
            $this->notificationService->sendBookingConfirmation($booking);
            return response()->json(['message' => 'Confirmation email resent successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email'], 500);
        }
    }
}
