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
        // HARDCODED FOR DEBUGGING (As per previous successful test)
        // To ensure enviroment variables are not overriding with old keys
        $this->merchantId = 'PGTESTPAYUAT86'; 
        $this->saltKey = '96434309-7796-489d-8924-ab56988a6076';
        $this->saltIndex = '1';
        $this->env = 'UAT';
        
        $this->baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }

    /**
     * Initiate Payment Request
     */
    public function initiatePayment($booking, $callbackUrl)
    {
        $amountPaise = (int) ($booking->TotalAmount * 100);
        $transactionId = "TXN_" . $booking->BookingId . "_" . time();

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
                    'code' => $resData['code'] ?? 'UNKNOWN_ERROR'
                ];
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Exception", ['msg' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Server Error: ' . $e->getMessage()];
        }
    }

    /**
     * Validate Callback Checksum (Optional but recommended)
     */
    public function validateCallback($responsePayload, $checksumHeader)
    {
        // Logic: SHA256(responsePayload + saltKey) + ### + saltIndex == checksumHeader
        // Implement if verified mode is needed.
        return true; 
    }
}
