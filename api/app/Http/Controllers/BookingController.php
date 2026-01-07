<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Services\NotificationService;
use App\Services\PhonePeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    protected $notificationService;
    protected $phonePeService;

    public function __construct(NotificationService $notificationService, PhonePeService $phonePeService)
    {
        $this->notificationService = $notificationService;
        $this->phonePeService = $phonePeService;
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
        
        // Check availability logic
        $type = strtolower($property->property_type);
        $isWaterpark = ($type === 'waterpark' || $type === 'water park');

        if (!$isWaterpark) {
            // For villas/others, prevent overlap
            $existingBooking = Booking::where('PropertyId', $validated['PropertyId'])
                ->where(function($query) {
                    $query->whereIn('Status', ['Confirmed', 'locked', 'booked'])
                          ->orWhere(function($q2) {
                              // Only block for Pending bookings if they are recent (e.g., < 15 mins old)
                              // This prevents abandoned payment attempts from blocking dates forever
                              $q2->where('Status', 'Pending')
                                 ->where('created_at', '>', now()->subMinutes(15));
                          });
                })
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

        // Set status based on booking source
        Log::info("Booking Request", ['source' => $bookingSource, 'method' => $validated['payment_method']]);

        if ($bookingSource === 'public_calendar') {
            $validated['Status'] = 'Pending';
            $validated['payment_status'] = 'pending';
        } elseif ($validated['payment_method'] === 'online' || $validated['payment_method'] === 'phonepe' || $validated['payment_method'] === 'card' || $validated['payment_method'] === 'upi') {
            $validated['Status'] = 'Pending';
            $validated['payment_status'] = 'pending';
        } else {
            // Pay at Hotel / Offline
            $validated['Status'] = 'Confirmed'; 
            $validated['payment_status'] = 'pending'; 
        }
        
        $validated['booking_source'] = $bookingSource;

        // ATOMIC TRANSACTION START
        DB::beginTransaction();

        try {
            $booking = Booking::create($validated);

            // Handle Online Payment Initiation
            if (in_array($validated['payment_method'], ['card', 'upi', 'phonepe', 'online'])) {
                
                // Use PhonePeService Transactionally
                $callbackUrl = route('payment.callback');
                $paymentResult = $this->phonePeService->initiatePayment($booking, $callbackUrl);

                if ($paymentResult['success']) {
                    $booking->transaction_id = $paymentResult['transaction_id'];
                    $booking->save();
                    
                    DB::commit(); // Commit Booking + Transaction ID

                    return response()->json([
                        'message' => 'Booking initiated, redirecting to payment',
                        'booking' => $booking,
                        'payment_required' => true,
                        'redirect_url' => $paymentResult['redirect_url']
                    ], 201);
                } else {
                    // Payment Init Failed -> Rollback Booking
                    DB::rollBack();
                    Log::error("Payment Init Failed, Rolled Back Booking", ['error' => $paymentResult]);
                    
                    return response()->json([
                        'message' => 'Payment Gateway Error: ' . ($paymentResult['message'] ?? 'Unknown'),
                        'error_code' => $paymentResult['code'] ?? 'GATEWAY_ERROR'
                    ], 422); // Unprocessable Entity
                }
            }

            // Offline / Pay at Hotel Flow
            DB::commit();

            // Send confirmation notification if Confirmed
            if ($booking->Status === 'Confirmed') {
                $this->notificationService->sendBookingConfirmation($booking);
            }

            return response()->json([
                'message' => 'Booking created successfully',
                'booking' => $booking,
                'requires_confirmation' => $bookingSource !== 'customer_app',
                'payment_required' => false
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Booking Creation Exception", ['msg' => $e->getMessage()]);
            return response()->json(['message' => 'Internal Server Error', 'details' => $e->getMessage()], 500);
        }
    }

    public function search(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email',
            'mobile' => 'nullable|string'
        ]);

        $query = Booking::query()->with('property'); 

        // Check for Email OR Mobile match
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
        $booking = Booking::findOrFail($id);
        $booking->Status = 'Cancelled';
        $booking->save();

        return response()->json(['message' => 'Booking cancelled successfully', 'booking' => $booking]);
    }

    public function resendConfirmation($id)
    {
        $booking = Booking::with('property')->findOrFail($id);
        
        try {
            $this->notificationService->sendBookingConfirmation($booking);
            return response()->json(['message' => 'Confirmation email resent successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email'], 500);
        }
    }
}
