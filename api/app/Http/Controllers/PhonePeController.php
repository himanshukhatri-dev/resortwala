<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PhonePeController extends Controller
{
    private $merchantId;
    private $saltKey;
    private $saltIndex;
    private $env;
    private $baseUrl;


    public function __construct()
    {
        $this->merchantId = env('PHONEPE_MERCHANT_ID'); 
        $this->saltKey = env('PHONEPE_SALT_KEY');
        $this->saltIndex = env('PHONEPE_SALT_INDEX', '1'); 
        $this->env = env('PHONEPE_ENV', 'PROD'); 
        
        // Log what is actually loaded (masked)
        Log::info("PhonePeController Init: Env={$this->env}, MID=" . substr($this->merchantId ?? '', 0, 4) . "***");

        $this->baseUrl = $this->env === 'PROD' 
            ? 'https://api.phonepe.com/apis/hermes' 
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }

    public function initiatePayment(Request $request)
    {
        // 0. Check Configuration
        if (empty($this->merchantId) || empty($this->saltKey)) {
            return response()->json([
                'success' => false,
                'message' => 'PhonePe configuration missing. Please check .env file.',
                'debug' => [
                    'env' => $this->env,
                    'merchantId_configured' => !empty($this->merchantId) ? $this->merchantId : 'MISSING',
                    'saltKey_configured' => !empty($this->saltKey) ? 'YES (Hidden)' : 'MISSING',
                ]
            ], 500);
        }

        // 1. Validate Input
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'mobile' => 'required|string',
            'bookingId' => 'nullable|string', 
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Invalid Input', 'errors' => $validator->errors()], 422);
        }

        // 2. Prepare Transaction Data
        $merchantTransactionId = 'TXN_' . uniqid() . '_' . time();
        $amount = 100; // STRICTLY 100 paise (₹1)
        $userId = 'USER_' . preg_replace('/[^0-9]/', '', $request->mobile);

        // Callback URL (Server-to-Server)
        // Ensure this route exists in api.php and is publicly accessible
        $callbackUrl = route('phonepe.callback'); 
        
        // Redirect URL (Client-Side) - Where user goes after payment
        // We'll redirect to a success/failure page on the frontend
        $redirectUrl = env('FRONTEND_URL', 'http://localhost:5173') . "/payment/success";

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $merchantTransactionId,
            'merchantUserId' => $userId,
            'amount' => $amount,
            'redirectUrl' => $redirectUrl,
            'redirectMode' => 'REDIRECT', // or POST
            'callbackUrl' => $callbackUrl,
            'mobileNumber' => $request->mobile,
            'paymentInstrument' => [
                'type' => 'PAY_PAGE'
            ]
        ];

        // 3. Encode & Checksum Generation
        $payloadJson = json_encode($payload);
        $base64Payload = base64_encode($payloadJson);
        
        $checksumString = $base64Payload . "/pg/v1/pay" . $this->saltKey;
        $checksum = hash('sha256', $checksumString) . '###' . $this->saltIndex;

        // 4. Call PhonePe API
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $this->merchantId, // Added missing header which helps in routing
            ])->post($this->baseUrl . '/pg/v1/pay', [
                'request' => $base64Payload
            ]);

            $resData = $response->json();

            Log::info("PhonePe Init Response: ", $resData ?? []);

            if ($response->successful() && isset($resData['success']) && $resData['success'] === true) {
                return response()->json([
                    'success' => true,
                    'payment_url' => $resData['data']['instrumentResponse']['redirectInfo']['url'],
                    'merchantTransactionId' => $merchantTransactionId
                ]);
            } else {
                Log::error("PhonePe Init Failed", ['response' => $resData, 'payload' => $payload, 'body' => $response->body()]); // Log Raw Body
                return response()->json([
                    'success' => false,
                    'message' => $resData['message'] ?? 'Payment Initiation Failed from PhonePe',
                    'code' => $response->status(), // Use HTTP Status code if JSON code is missing
                    'debug' => $resData ?? ['raw_body' => $response->body()], // Show Raw Body if JSON is null
                    'sent_mid' => $this->merchantId,
                    'sent_url' => $this->baseUrl . '/pg/v1/pay'
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Exception: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function callback(Request $request)
    {
        Log::info("PhonePe Callback Received: ", $request->all());

        try {
            $content = $request->getContent();
            $response = json_decode(base64_decode($request->response), true);

            // 1. Verify Checksum
            $xVerify = $request->header('X-VERIFY');
            // Re-calculate checksum to verify source
            // Note: Validation logic depends on PhonePe's specific callback format.
            // Usually it's SHA256(base64_response + salt) + ### + index
            
            // For now, let's log the status
            if (isset($response['code']) && $response['code'] === 'PAYMENT_SUCCESS') {
                // Payment Success
                $transactionId = $response['data']['merchantTransactionId'];
                Log::info("Payment Successful for TXN: $transactionId");
                
                // TODO: Update Order Status in Database
                
                return response()->json(['status' => 'success']);
            } else {
                Log::error("Payment Failed/Pending in Callback");
                return response()->json(['status' => 'failure']);
            }

        } catch (\Exception $e) {
            Log::error("Callback Exception: " . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    public function checkStatus($transactionId)
    {
        $saltKey = $this->saltKey;
        $saltIndex = $this->saltIndex;

        $finalXHeader = hash('sha256', "/pg/v1/status/{$this->merchantId}/{$transactionId}" . $saltKey) . "###" . $saltIndex;

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-VERIFY' => $finalXHeader,
            'X-MERCHANT-ID' => $this->merchantId,
        ])->get($this->baseUrl . "/pg/v1/status/{$this->merchantId}/{$transactionId}");

        return $response->json();
    }
}
