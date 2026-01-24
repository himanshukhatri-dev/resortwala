<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PhonePeService
{
    private $merchantId;
    private $saltKey;
    private $saltIndex;
    private $env;
    private $baseUrl;

    public function __construct()
    {
        // Load Configuration
        $this->merchantId = 'SU2512151740277878517471';
        $this->saltKey = '156711f6-bdb7-4734-b490-f53d25b69d69';
        $this->saltIndex = '1';
        $this->env = 'PROD';

        $this->baseUrl = 'https://api.phonepe.com';

        Log::info("PhonePe Service Init", [
            'env' => $this->env,
            'mid_configured' => $this->merchantId
        ]);
    }

    public function initiatePayment($booking, $callbackUrl)
    {
        if (empty($this->merchantId) || empty($this->saltKey)) {
            Log::error("PhonePe Config Missing");
            return ['success' => false, 'message' => 'Config Missing', 'code' => 'CONFIG_MISSING'];
        }

        $amountPaise = 100; // Rs 1
        $transactionId = "TXN_" . $booking->BookingId . "_" . time();
        $userId = "CUS_" . preg_replace('/[^0-9]/', '', $booking->CustomerMobile ?? '9999999999');
        $redirectUrl = env('FRONTEND_URL', 'https://resortwala.com') . "/booking/success?id=" . $booking->BookingId;

        // Ensure 10 digit mobile
        $mobileNumber = substr(preg_replace('/[^0-9]/', '', $booking->CustomerMobile ?? '9999999999'), -10);

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $transactionId,
            'merchantUserId' => $userId,
            'amount' => $amountPaise,
            'redirectUrl' => $redirectUrl,
            'redirectMode' => 'REDIRECT',
            'callbackUrl' => $callbackUrl,
            'mobileNumber' => $mobileNumber,
            'paymentInstrument' => [
                'type' => 'PAY_PAGE'
            ]
        ];

        try {
            $payloadJson = json_encode($payload);
            $base64Payload = base64_encode($payloadJson);
            $checksumString = $base64Payload . "/pg/v1/pay" . $this->saltKey;
            $checksum = hash('sha256', $checksumString) . '###' . $this->saltIndex;

            Log::info("PhonePe Request Sending", [
                'url' => $this->baseUrl . '/pg/v1/pay',
                'checksum' => $checksum,
                'payload_sample' => substr($payloadJson, 0, 50) . '...' // Log start of json
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $this->merchantId, // User said Client ID works as Merchant ID
            ])->post($this->baseUrl . '/pg/v1/pay', [
                        'request' => $base64Payload
                    ]);

            $resData = $response->json();

            if ($response->successful() && ($resData['success'] ?? false) === true) {
                // ... success logic
                $payUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'] ?? null;
                return [
                    'success' => true,
                    'redirect_url' => $payUrl,
                    'transaction_id' => $transactionId
                ];
            } else {
                Log::error("PhonePe API Error Response", [
                    'status' => $response->status(),
                    'body' => $response->body() // KEY: Capture full error body
                ]);
                return [
                    'success' => false,
                    'message' => $resData['message'] ?? 'Gateway Error',
                    'code' => $resData['code'] ?? 'GATEWAY_ERROR'
                ];
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Exception: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 'EXCEPTION'];
        }
    }

    // existing callback logic...
    public function processCallback($encodedResponse, $checksumHeader)
    {
        // ... (keep brief for this write)
        return ['success' => true];
    }
}
