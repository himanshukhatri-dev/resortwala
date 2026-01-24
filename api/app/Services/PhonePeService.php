<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PhonePeService
{
    private $merchantId;
    private $clientId;
    private $clientSecret;
    private $saltKey;
    private $saltIndex;
    private $env;
    private $baseUrl;

    public function __construct()
    {
        // Load Configuration from config/phonepe.php
        $this->merchantId = config('phonepe.merchant_id');
        $this->clientId = config('phonepe.client_id');
        $this->clientSecret = config('phonepe.client_secret');
        $this->saltKey = config('phonepe.salt_key');
        $this->saltIndex = config('phonepe.salt_index');
        $this->env = config('phonepe.env', 'PROD');

        $isUat = strtolower($this->env) === 'uat';
        // USE HERMES ENDPOINT FOR ENTERPRISE
        $this->baseUrl = $isUat
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            : 'https://api.phonepe.com/apis/hermes';

        Log::info("PhonePe Service Init (Enterprise)", [
            'env' => $this->env,
            'mid' => $this->merchantId,
            'clientId' => $this->clientId,
            'baseUrl' => $this->baseUrl
        ]);
    }

    /**
     * Generate OAuth2 Access Token using Client ID and Secret
     */
    private function getAccessToken()
    {
        if (empty($this->clientId) || empty($this->clientSecret)) {
            Log::error("PhonePe OAuth Credentials Missing in .env");
            return null;
        }

        $tokenUrl = $this->baseUrl . '/oauth/v1/token';

        try {
            $response = Http::asForm()->post($tokenUrl, [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'client_credentials',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['access_token'] ?? null;
            }

            Log::error("PhonePe Token Generation Failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return null;

        } catch (\Exception $e) {
            Log::error("PhonePe Token Exception: " . $e->getMessage());
            return null;
        }
    }

    public function initiatePayment($booking, $callbackUrl)
    {
        if (empty($this->merchantId)) {
            Log::error("PhonePe Merchant ID Missing");
            return ['success' => false, 'message' => 'Config Missing', 'code' => 'CONFIG_MISSING'];
        }

        // 1. Get OAuth Token
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Authentication Failed. Check PhonePe Credentials.',
                'code' => 'AUTH_FAILED'
            ];
        }

        $amountPaise = round($booking->paid_amount * 100);
        $transactionId = $booking->transaction_id ?? ("TXN_" . $booking->BookingId . "_" . time());
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

            // Generate X-VERIFY Checksum (Still often required even with Bearer token)
            $checksumString = $base64Payload . "/pg/v1/pay" . $this->saltKey;
            $checksum = hash('sha256', $checksumString) . '###' . $this->saltIndex;

            Log::info("PhonePe Initiating Request", [
                'url' => $this->baseUrl . '/pg/v1/pay',
                'mid' => $this->merchantId,
                'txn' => $transactionId,
                'amount' => $amountPaise
            ]);

            $response = Http::withHeaders([
                'Authorization' => "Bearer " . $accessToken,
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $this->merchantId,
            ])->post($this->baseUrl . '/pg/v1/pay', [
                        'request' => $base64Payload
                    ]);

            $resData = $response->json();

            if ($response->successful() && ($resData['success'] ?? false) === true) {
                $payUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'] ?? null;
                return [
                    'success' => true,
                    'redirect_url' => $payUrl,
                    'transaction_id' => $transactionId
                ];
            } else {
                Log::error("PhonePe API Error", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [
                    'success' => false,
                    'message' => $resData['message'] ?? 'Gateway Error',
                    'code' => $resData['code'] ?? 'GATEWAY_ERROR',
                    'detail' => $resData // Returned to controller for debugging
                ];
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Init Exception: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 'EXCEPTION'];
        }
    }

    public function processCallback($encodedResponse, $checksumHeader)
    {
        Log::info("PhonePe Callback Data Received");
        return ['success' => true];
    }
}
