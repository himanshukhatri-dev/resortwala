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

    public function initiate(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,BookingId',
            'redirect_url' => 'required|url' 
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        $amountPaise = (int) ($booking->TotalAmount * 100);
        $transactionId = "TXN_" . $booking->BookingId . "_" . time();

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $transactionId,
            'merchantUserId' => "USER_" . ($booking->vendor_id ?? 'GUEST'),
            'amount' => $amountPaise,
            'redirectUrl' => route('payment.callback'), 
            'redirectMode' => 'POST',
            'callbackUrl' => route('payment.callback'), 
            'mobileNumber' => $booking->CustomerMobile,
            'paymentInstrument' => [
                'type' => 'PAY_PAGE'
            ]
        ];

        // 1. Encode Payload (Crucial: JSON_UNESCAPED_SLASHES)
        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $base64Payload = base64_encode($jsonPayload);

        // 2. Calculate Checksum
        $stringToHash = $base64Payload . "/pg/v1/pay" . $this->saltKey;
        $checksum = hash('sha256', $stringToHash) . "###" . $this->saltIndex;

        // 3. Make API Call (Manual Body)
        $requestBody = json_encode(['request' => $base64Payload]);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum
            ])->withBody($requestBody, 'application/json')->post($this->baseUrl . "/pg/v1/pay");

            $resData = $response->json();

            if ($response->successful() && ($resData['success'] ?? false)) {
                $redirectUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'];
                
                $booking->transaction_id = $transactionId; 
                $booking->save();

                return response()->json([
                    'success' => true,
                    'redirect_url' => $redirectUrl,
                    'transaction_id' => $transactionId
                ]);
            } else {
                Log::error("PhonePe Init Failed", ['res' => $resData]);
                return response()->json(['success' => false, 'message' => $resData['message'] ?? 'Payment init failed'], 400);
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Exception", ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Server Error'], 500);
        }
    }

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
