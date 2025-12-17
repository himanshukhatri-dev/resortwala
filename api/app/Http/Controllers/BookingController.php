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
            'SpecialRequest' => 'nullable|string'
        ]);

        $validated['Status'] = 'Confirmed'; // Auto-confirm for now as per "Mock" flow
        $validated['payment_status'] = ($validated['payment_method'] === 'hotel') ? 'pending' : 'paid';

        $booking = Booking::create($validated);

        // Send confirmation notification
        $this->notificationService->sendBookingConfirmation($booking);

        return response()->json([
            'message' => 'Booking created successfully',
            'booking' => $booking
        ], 201);
    }
    public function search(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email',
            'mobile' => 'nullable|string'
        ]);

        $query = Booking::query()->with('property'); // Eager load property

        $query = Booking::query()->with('property');

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
}
