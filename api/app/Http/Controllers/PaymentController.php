<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    // Environment config
    private $merchantId;
    private $saltKey;
    private $saltIndex;
    private $env; // 'UAT' or 'PROD'
    private $baseUrl;

    public function __construct()
    {
        $this->merchantId = config('phonepe.merchant_id');
        $this->saltKey = config('phonepe.salt_key');
        $this->saltIndex = config('phonepe.salt_index');
        $this->env = config('phonepe.env');
    }

    // Initiate method moved to BookingController (via PhonePeService) for atomic transaction.
    // Ensure only callback logic remains here.

    public function callback(Request $request)
    {
        try {
            Log::info("Payment Callback Hit", $request->all());

            if (!$request->has('response') && !$request->has('code')) {
                // Fallback: Check if it's a S2S callback or Redirect?
                Log::error("Callback missing 'response' param", $request->all());
                return response()->json(['error' => 'Invalid Callback', 'data' => $request->all()], 400);
            }

            $base64Response = $request->input('response');
            $resData = json_decode(base64_decode($base64Response), true);
            
            $merchantTxnId = $resData['data']['merchantTransactionId'] ?? null;
            $state = $resData['code'] ?? 'PAYMENT_ERROR';

            if ($merchantTxnId) {
                // Extract Booking ID from TXN_123_timestamp
                $parts = explode('_', $merchantTxnId);
                $bookingId = $parts[1] ?? null;
                Log::info("Extracted Booking ID", ['txn' => $merchantTxnId, 'id' => $bookingId]);

                if ($bookingId) {
                    $booking = Booking::find($bookingId);
                    if ($booking) {
                        if ($state === 'PAYMENT_SUCCESS') {
                            $booking->payment_status = 'paid';
                            $booking->Status = 'Confirmed'; 
                        } elseif ($state === 'PAYMENT_PENDING') {
                            $booking->payment_status = 'pending';
                            $booking->Status = 'Pending';
                        } else {
                            $booking->payment_status = 'failed';
                            $booking->Status = 'Cancelled';
                        }
                        $booking->save(); 
                    } else {
                        Log::error("Booking Not Found for ID: $bookingId");
                    }
                }
            } else {
                Log::error("Callback missing merchantTransactionId");
            }
            
            // Redirect User
            $frontendUrl = env('FRONTEND_URL', 'https://beta.resortwala.com'); 
            
            if ($state === 'PAYMENT_SUCCESS') {
                return redirect()->to("$frontendUrl/booking/success?id=" . ($bookingId ?? ''));
            } elseif ($state === 'PAYMENT_PENDING') {
                return redirect()->to("$frontendUrl/booking/pending?id=" . ($bookingId ?? ''));
            } else {
                return redirect()->to("$frontendUrl/booking/failed?id=" . ($bookingId ?? ''));
            }

        } catch (\Exception $e) {
            Log::error("Payment Callback Error", ['e' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Error'], 500);
        }
    }
}
