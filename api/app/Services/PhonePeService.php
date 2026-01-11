<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PhonePeService
{
    private $merchantId;
    private $saltKey;
    private $saltIndex;
    private $env; 
    private $baseUrl;

    public function __construct()
    {
        // FORCE SANDBOX CREDENTIALS (Bypassing SERVER ENV issues)
        $this->merchantId = 'PGTESTPAYUAT86';
        $this->saltKey = '96434309-7796-489d-8924-ab56988a6076';
        $this->saltIndex = '1';
        $this->env = 'UAT'; 
        
        $this->baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
            
        Log::info("PhonePe Service Init (Hardcoded FORCE UAT)", [
            'mid' => $this->merchantId,
            'baseUrl' => $this->baseUrl
        ]);
    }

    /**
     * Initiate Payment Request
     */
    public function initiatePayment($booking, $callbackUrl)
    {
        $amountPaise = (int) ($booking->TotalAmount * 100);
        $transactionId = "TXN_" . $booking->BookingId . "_" . time();

        Log::info("PhonePe Init: Using MerchantID", [
            'merchantId' => $this->merchantId, 
            'env' => $this->env,
            'amount' => $amountPaise
        ]);

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $transactionId,
            'merchantUserId' => "USER_" . ($booking->vendor_id ?? 'GUEST'),
            'amount' => $amountPaise,
            'redirectUrl' => $callbackUrl, 
            'redirectMode' => 'POST',
            'callbackUrl' => $callbackUrl, 
            'mobileNumber' => $booking->CustomerMobile,
            'paymentInstrument' => [
                'type' => 'PAY_PAGE'
            ]
        ];

        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $base64Payload = base64_encode($jsonPayload);

        $stringToHash = $base64Payload . "/pg/v1/pay" . $this->saltKey;
        $checksum = hash('sha256', $stringToHash) . "###" . $this->saltIndex;

        $requestBody = json_encode(['request' => $base64Payload]);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum
            ])->withBody($requestBody, 'application/json')->post($this->baseUrl . "/pg/v1/pay");

            $resData = $response->json();

            if ($response->successful() && ($resData['success'] ?? false)) {
                return [
                    'success' => true,
                    'redirect_url' => $resData['data']['instrumentResponse']['redirectInfo']['url'],
                    'transaction_id' => $transactionId
                ];
            } else {
                Log::error("PhonePe Init Failed", ['res' => $resData]);
                return [
                    'success' => false, 
                    'message' => $resData['message'] ?? 'Payment init failed',
                    'code' => $resData['code'] ?? 'UNKNOWN_ERROR',
                    'debug' => [
                        'used_mid' => $this->merchantId,
                        'used_url' => $this->baseUrl,
                        'sent_amount' => $amountPaise
                    ]
                ];
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Exception", ['msg' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Server Error: ' . $e->getMessage()];
        }
    }

    /**
     * Process Callback
     * Validates Checksum & Decodes Payload
     */
    public function processCallback($base64Response, $checksumHeader)
    {
        if (empty($checksumHeader) || empty($base64Response)) {
             return ['success' => false, 'error' => 'Missing Parameters'];
        }

        // 1. Validate Checksum
        $generatedChecksum = hash('sha256', $base64Response . $this->saltKey) . "###" . $this->saltIndex;
        if ($generatedChecksum !== $checksumHeader) {
            Log::warning("PhonePe Checksum Mismatch", [
                'received' => $checksumHeader,
                'generated' => $generatedChecksum
            ]);
            return ['success' => false, 'error' => 'Checksum Verification Failed'];
        }

        // 2. Decode Payload
        $resData = json_decode(base64_decode($base64Response), true);
        
        $merchantTxnId = $resData['data']['merchantTransactionId'] ?? null;
        $state = $resData['code'] ?? 'PAYMENT_ERROR';
        $transactionId = $resData['data']['transactionId'] ?? null;
        
        // Extract Booking ID
        $bookingId = null;
        if ($merchantTxnId) {
             $parts = explode('_', $merchantTxnId);
             $bookingId = $parts[1] ?? null;
        }

        return [
            'success' => true,
            'booking_id' => $bookingId,
            'status' => $state,
            'transaction_id' => $transactionId,
            'merchant_txn_id' => $merchantTxnId,
            'raw_data' => $resData
        ];
    }
}
