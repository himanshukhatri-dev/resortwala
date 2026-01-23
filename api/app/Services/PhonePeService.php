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
        // Load Configuration from Config/PhonePe
        $this->merchantId = config('phonepe.merchant_id');
        $this->saltKey = config('phonepe.salt_key');
        $this->saltIndex = config('phonepe.salt_index', '1');
        $this->env = config('phonepe.env', 'UAT');

        $this->baseUrl = ($this->env === 'PROD')
            ? 'https://api.phonepe.com/apis/hermes'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

        Log::info("PhonePe Service Manual V1 Init", [
            'env' => $this->env,
            'merchantId' => substr($this->merchantId ?? '', 0, 4) . '***'
        ]);
    }

    /**
     * Initiate Payment Request using Standard V1 Flow (Base64 + Checksum)
     */
    public function initiatePayment($booking, $callbackUrl)
    {
        if (empty($this->merchantId) || empty($this->saltKey)) {
            Log::error("PhonePe Configuration Missing", ['mid' => $this->merchantId]);
            return [
                'success' => false,
                'message' => 'Payment Gateway Configuration Missing',
                'code' => 'CONFIG_MISSING'
            ];
        }

        // Calculate Amount in Paise
        // $paymentAmount = ($booking->paid_amount > 0) ? $booking->paid_amount : $booking->TotalAmount;
        // $amountPaise = (int) ($paymentAmount * 100);
        $amountPaise = 100; // HARDCODED RS 1 FOR LIVE TESTING as requested

        $transactionId = "TXN_" . $booking->BookingId . "_" . time();
        $userId = "CUS_" . ($booking->CustomerMobile ?? 'GUEST');

        // Redirect URL (Frontend Success Page)
        $redirectUrl = env('FRONTEND_URL', 'https://resortwala.com') . "/booking/success?id=" . $booking->BookingId;

        // Sanitize Mobile Number (Remove +91, spaces, ensure 10 digits)
        $rawMobile = $booking->CustomerMobile ?? '9999999999';
        $mobileNumber = preg_replace('/[^0-9]/', '', $rawMobile);
        if (strlen($mobileNumber) > 10) {
            $mobileNumber = substr($mobileNumber, -10);
        }

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

            // SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
            $checksumString = $base64Payload . "/pg/v1/pay" . $this->saltKey;
            $checksum = hash('sha256', $checksumString) . '###' . $this->saltIndex;

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $this->merchantId,
            ])->post($this->baseUrl . '/pg/v1/pay', [
                        'request' => $base64Payload
                    ]);

            $resData = $response->json();

            if ($response->successful() && isset($resData['success']) && $resData['success'] === true) {
                $payUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'] ?? null;

                Log::info("PhonePe Payment Initiated", [
                    'tx_id' => $transactionId,
                    'booking_id' => $booking->BookingId
                ]);

                return [
                    'success' => true,
                    'redirect_url' => $payUrl,
                    'transaction_id' => $transactionId
                ];
            } else {
                Log::error("PhonePe API Failed", [
                    'status' => $response->status(),
                    'response' => $resData,
                    'body' => $response->body(),
                    'payload' => $payload
                ]);
                return [
                    'success' => false,
                    'message' => $resData['message'] ?? 'Payment Gateway Error',
                    'code' => 'GATEWAY_ERROR',
                    'debug' => $resData
                ];
            }

        } catch (\Exception $e) {
            Log::error("PhonePe Service Exception", ['msg' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Internal Gateway Error',
                'code' => 'EXCEPTION'
            ];
        }
    }

    /**
     * Process Callback / Checksum Verification
     */
    public function processCallback($encodedResponse, $checksumHeader)
    {
        if (empty($checksumHeader) || empty($encodedResponse)) {
            return ['success' => false, 'error' => 'Missing Parameters'];
        }

        // 1. Validate Checksum
        // Pattern: SHA256(base64Response + saltKey) + "###" + saltIndex
        $generatedChecksum = hash('sha256', $encodedResponse . $this->saltKey) . "###" . $this->saltIndex;

        if ($generatedChecksum !== $checksumHeader) {
            Log::warning("PhonePe Callback Checksum Mismatch", [
                'received' => $checksumHeader,
                'generated' => $generatedChecksum
            ]);
            // Still proceed to decode for visibility, but mark as unverified
        }

        // 2. Decode Payload
        $resData = json_decode(base64_decode($encodedResponse), true);

        $merchantTxnId = $resData['data']['merchantTransactionId'] ?? null;
        $state = $resData['code'] ?? 'PAYMENT_ERROR';
        $transactionId = $resData['data']['transactionId'] ?? null;

        // Extract Booking ID from Merchant Transaction ID (Format: TXN_ID_TIMESTAMP)
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
            'raw_data' => $resData,
            'checksum_verified' => ($generatedChecksum === $checksumHeader)
        ];
    }
}
