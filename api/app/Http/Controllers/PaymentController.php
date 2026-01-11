<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    // Environment config
    protected $phonePeService;
    private $frontEndUrl;

    public function __construct(\App\Services\PhonePeService $phonePeService)
    {
        $this->phonePeService = $phonePeService;
        $this->frontEndUrl = env('FRONTEND_URL', 'https://beta.resortwala.com');
    }

    public function callback(Request $request)
    {
        try {
            Log::info("Payment Callback Hit", $request->all());

            // 1. Basic Validation
            if (!$request->has('response')) {
                Log::error("Callback missing 'response' param", $request->all());
                return response()->json([
                    'error' => 'Invalid Callback',
                    'debug_keys' => array_keys($request->all()),
                    'debug_content_type' => $request->header('Content-Type'),
                    'debug_raw_content' => substr($request->getContent(), 0, 1000)
                ], 400);
            }

            $xVerify = $request->header('X-VERIFY') ?? $request->header('X-Verify');
            $base64Response = $request->input('response');

            // 2. Delegate Processing to Service
            $result = $this->phonePeService->processCallback($base64Response, $xVerify);

            if (!$result['success']) {
                Log::critical("PhonePe Callback Failed", [
                    'ip' => $request->ip(),
                    'error' => $result['error']
                ]);
                return response()->json(['error' => $result['error']], 403);
            }

            // 3. Handle Business Logic
            $bookingId = $result['booking_id'];
            $state = $result['status'];
            $transactionId = $result['transaction_id'];
            $merchantTxnId = $result['merchant_txn_id'];

            if ($bookingId) {
                $booking = Booking::with('property')->find($bookingId);
                
                if ($booking) {
                    Log::info("Processing Payment for Booking #$bookingId - Status: $state");

                    if ($state === 'PAYMENT_SUCCESS') {
                        if ($booking->payment_status !== 'paid') {
                            $booking->payment_status = 'paid';
                            $booking->Status = 'Confirmed';
                            $booking->transaction_id = $transactionId ?? $merchantTxnId;
                            $booking->save();

                            // Send Confirmation Email (Async)
                            try {
                                $notif = app(\App\Services\NotificationService::class);
                                $notif->sendBookingConfirmation($booking);
                            } catch (\Exception $e) {
                                Log::error("Failed to send booking confirmation: " . $e->getMessage());
                            }
                        }
                    } elseif ($state === 'PAYMENT_PENDING') {
                        $booking->payment_status = 'pending';
                        // Keep status as Pending
                        $booking->save();
                    } else {
                        $booking->payment_status = 'failed';
                        $booking->Status = 'Cancelled';
                        $booking->save();
                    }
                } else {
                    Log::error("Booking Not Found for ID: $bookingId (Txn: $merchantTxnId)");
                }
            } else {
                Log::error("Callback missing Booking ID in merchantTransactionId");
            }
            
            // 4. Redirect User
            if ($state === 'PAYMENT_SUCCESS') {
                return redirect()->to("{$this->frontEndUrl}/booking/success?id=" . ($bookingId ?? ''));
            } elseif ($state === 'PAYMENT_PENDING') {
                return redirect()->to("{$this->frontEndUrl}/booking/pending?id=" . ($bookingId ?? ''));
            } else {
                return redirect()->to("{$this->frontEndUrl}/booking/failed?id=" . ($bookingId ?? ''));
            }

        } catch (\Exception $e) {
            Log::error("Payment Callback Handled Exception", ['e' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}
