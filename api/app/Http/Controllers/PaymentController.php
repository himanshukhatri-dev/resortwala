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
        // HARDCODED FOR DEBUGGING: To ensure enviroment variables are not overriding with old keys
        $this->merchantId = 'PGTESTPAYUAT86'; 
        $this->saltKey = '96434309-7796-489d-8924-ab56988a6076';
        $this->saltIndex = '1';
        $this->env = 'UAT';
        
        $this->baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }

    // Initiate method moved to BookingController (via PhonePeService) for atomic transaction.
    // Ensure only callback logic remains here.

    public function callback(Request $request)
    {
        try {
            if (!$request->has('response')) {
                return response()->json(['error' => 'Invalid Callback'], 400);
            }

            $base64Response = $request->input('response');
            $resData = json_decode(base64_decode($base64Response), true);
            
            $merchantTxnId = $resData['data']['merchantTransactionId'] ?? null;
            $state = $resData['code'] ?? 'PAYMENT_ERROR';

            if ($merchantTxnId) {
                // Extract Booking ID from TXN_123_timestamp
                $parts = explode('_', $merchantTxnId);
                $bookingId = $parts[1] ?? null;

                if ($bookingId) {
                    $booking = Booking::find($bookingId);
                    if ($booking) {
                        if ($state === 'PAYMENT_SUCCESS') {
                            $booking->payment_status = 'paid';
                            $booking->Status = 'Confirmed'; 
                        } else {
                            $booking->payment_status = 'failed';
                            $booking->Status = 'Cancelled';
                        }
                        $booking->save(); 
                    }
                }
            }
            
            // Redirect User
            $frontendUrl = env('FRONTEND_URL', 'https://resortwala.com'); 
            
            if ($state === 'PAYMENT_SUCCESS') {
                return redirect()->to("$frontendUrl/booking/success?id=" . ($bookingId ?? ''));
            } else {
                return redirect()->to("$frontendUrl/booking/failed?id=" . ($bookingId ?? ''));
            }

        } catch (\Exception $e) {
            Log::error("Payment Callback Error", ['e' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Error'], 500);
        }
    }
}
