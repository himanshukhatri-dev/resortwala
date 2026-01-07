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
        $this->merchantId = env('PHONEPE_MERCHANT_ID', 'M223R7WEM0IRX_2512221801'); // Provided Test ID
        $this->saltKey = env('PHONEPE_SALT_KEY', '1fd12568-68a2-4103-916d-d620ef215711'); // Decoded from provided secret
        $this->saltIndex = env('PHONEPE_SALT_INDEX', '1');
        $this->env = env('PHONEPE_ENV', 'UAT');
        
        $this->baseUrl = ($this->env === 'PROD') 
            ? 'https://api.phonepe.com/apis/hermes' 
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }

    public function initiate(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,BookingId',
            'redirect_url' => 'required|url' // Where frontend wants to return (e.g., /booking/success)
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        // Calculate amount in PAISE (100 paise = 1 INR)
        // Ensure total amount is used. Check if partial payment is allowed? assuming full.
        $amountPaise = (int) ($booking->TotalAmount * 100);

        $transactionId = "TXN_" . $booking->BookingId . "_" . time();

        // Save transaction ID to booking for tracking (optional, or use meta column)
        // $booking->transaction_id = $transactionId; 
        // $booking->save();

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $transactionId,
            'merchantUserId' => "USER_" . ($booking->vendor_id ?? 'GUEST'),
            'amount' => $amountPaise,
            'redirectUrl' => route('payment.callback'), // Server-to-Server Callback? Or Redirect?
            'redirectMode' => 'POST',
            'callbackUrl' => route('payment.callback'), // Webhook
            'mobileNumber' => $booking->CustomerMobile,
            'paymentInstrument' => [
                'type' => 'PAY_PAGE'
            ]
        ];

        // 1. Encode Payload to Base64
        $base64Payload = base64_encode(json_encode($payload));

        // 2. Calculate Checksum: SHA256(Base64 + "/pg/v1/pay" + SaltKey) + "###" + SaltIndex
        $stringToHash = $base64Payload . "/pg/v1/pay" . $this->saltKey;
        $checksum = hash('sha256', $stringToHash) . "###" . $this->saltIndex;

        // 3. Make API Call
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum
            ])->post($this->baseUrl . "/pg/v1/pay", [
                'request' => $base64Payload
            ]);

            $resData = $response->json();

            if ($response->successful() && ($resData['success'] ?? false)) {
                $redirectUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'];
                
                // Store temp transaction ID mapping if needed, or rely on callback
                $booking->transaction_id = $transactionId; // Ensure migration has this OR use a json column
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
        // Handle Server-to-Server Callback from PhonePe
        try {
            $input = $request->all();
            
            // X-VERIFY Header is required for validation
            // But usually, standard callback payload is base64(body) + checksum
            // PhonePe sends POST with 'response' (base64) and X-VERIFY header.
            
            if (!$request->has('response')) {
                return response()->json(['error' => 'Invalid Callback'], 400);
            }

            $base64Response = $request->input('response');
            // $checksumHeader = $request->header('X-VERIFY');

            // Optionally verify checksum here... logic: SHA256(response + salt) + ### + index
            
            $resData = json_decode(base64_decode($base64Response), true);
            
            $merchantTxnId = $resData['data']['merchantTransactionId'];
            $state = $resData['code']; // PAYMENT_SUCCESS, PAYMENT_ERROR

            // Extract Booking ID from TXN_123_timestamp
            $parts = explode('_', $merchantTxnId);
            $bookingId = $parts[1] ?? null;

            if ($bookingId) {
                $booking = Booking::find($bookingId);
                if ($booking) {
                    if ($state === 'PAYMENT_SUCCESS') {
                        $booking->payment_status = 'paid';
                        $booking->Status = 'Confirmed'; // Auto confirm on payment?
                    } else {
                        $booking->payment_status = 'failed';
                        $booking->Status = 'Cancelled'; // Or Pending Payment?
                    }
                    $booking->save(); // Save payment metadata if needed
                }
            }
            
            // If this is a redirect from the user's browser (RedirectUrl), we should show a UI.
            // But since we set redirectMode=POST, this endpoint handles it.
            // We should redirect the USER back to the frontend.
            
            $frontendUrl = env('FRONTEND_URL', 'https://resortwala.com'); 
            // Better to dynamic based on env (beta vs prod)
            
            if ($state === 'PAYMENT_SUCCESS') {
                return redirect()->to("$frontendUrl/booking/success?id=$bookingId");
            } else {
                return redirect()->to("$frontendUrl/booking/failed?id=$bookingId");
            }

        } catch (\Exception $e) {
            Log::error("Payment Callback Error", ['e' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Error'], 500);
        }
    }
}
