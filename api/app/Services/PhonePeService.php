<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

// SDK Imports (Optional, will check existence at runtime)
use PhonePe\payments\v2\standardCheckout\StandardCheckoutClient;
use PhonePe\payments\v2\models\request\builders\StandardCheckoutPayRequestBuilder;
use PhonePe\Env;

class PhonePeService
{
    private $merchantId;
    private $clientId;
    private $clientSecret;
    private $saltKey;
    private $saltIndex;
    private $env;

    // Multi-Host Fallback List for Resilient Mode (Non-SDK)
    private $prodHosts = [
        'https://api.phonepe.com/apis/hermes',
        'https://merchants.phonepe.com',
        'https://api.phonepe.com'
    ];

    public function __construct()
    {
        $this->merchantId = config('phonepe.merchant_id');
        $this->clientId = config('phonepe.client_id');
        $this->clientSecret = config('phonepe.client_secret');
        $this->saltKey = config('phonepe.salt_key');
        $this->saltIndex = config('phonepe.salt_index', '1');
        $this->env = config('phonepe.env', 'PROD');

        $hasSdk = class_exists('\PhonePe\payments\v2\standardCheckout\StandardCheckoutClient');

        Log::info("PhonePe Service Initialized", [
            'mid' => $this->merchantId,
            'env' => $this->env,
            'using_sdk' => $hasSdk ? 'YES' : 'NO (Using Resilient Fallback)'
        ]);
    }

    public function initiatePayment($booking, $callbackUrl)
    {
        if (empty($this->merchantId) || empty($this->saltKey)) {
            return ['success' => false, 'message' => 'PhonePe Config Missing'];
        }

        // Try Official SDK first if available
        if (class_exists('\PhonePe\payments\v2\standardCheckout\StandardCheckoutClient')) {
            try {
                return $this->initiateWithSdk($booking, $callbackUrl);
            } catch (\Exception $e) {
                Log::error("PhonePe SDK Failure, falling back to resilient mode", ['error' => $e->getMessage()]);
            }
        }

        return $this->initiateResilientManual($booking, $callbackUrl);
    }

    /**
     * Initiation using Official PhonePe SDK (V2 Standard Checkout)
     */
    private function initiateWithSdk($booking, $callbackUrl)
    {
        $amountPaise = round($booking->paid_amount * 100);
        $transactionId = $booking->transaction_id ?? ("RW_" . $booking->BookingId . "_" . time());
        $redirectUrl = env('FRONTEND_URL', 'https://resortwala.com') . "/booking/success?id=" . $booking->BookingId;

        $env = (strtolower($this->env) === 'uat') ? Env::UAT : Env::PRODUCTION;

        $phonepeClient = StandardCheckoutClient::getInstance(
            $this->clientId,
            1, // Client Version
            $this->clientSecret,
            $env
        );

        $payRequest = (new StandardCheckoutPayRequestBuilder())
            ->merchantOrderId($transactionId)
            ->amount($amountPaise)
            ->message("Booking: " . $booking->booking_reference)
            ->redirectUrl($redirectUrl)
            ->build();

        $payResponse = $phonepeClient->pay($payRequest);

        if ($payResponse->getState() === "PENDING" || !empty($payResponse->getRedirectUrl())) {
            return [
                'success' => true,
                'redirect_url' => $payResponse->getRedirectUrl(),
                'transaction_id' => $transactionId
            ];
        }

        throw new \Exception("SDK Payment State: " . $payResponse->getState());
    }

    /**
     * Highly resilient manual implementation for when SDK is missing or failing mapping
     */
    private function initiateResilientManual($booking, $callbackUrl)
    {
        $amountPaise = round($booking->paid_amount * 100);
        $transactionId = $booking->transaction_id ?? ("RW_" . $booking->BookingId . "_" . time());
        $redirectUrl = env('FRONTEND_URL', 'https://resortwala.com') . "/booking/success?id=" . $booking->BookingId;
        $mobileNumber = substr(preg_replace('/[^0-9]/', '', $booking->CustomerMobile ?? '9999999999'), -10);

        $payload = [
            'merchantId' => $this->merchantId,
            'merchantTransactionId' => $transactionId,
            'merchantUserId' => "CUS_" . $mobileNumber,
            'amount' => $amountPaise,
            'redirectUrl' => $redirectUrl,
            'redirectMode' => 'REDIRECT',
            'callbackUrl' => $callbackUrl,
            'mobileNumber' => $mobileNumber,
            'paymentInstrument' => ['type' => 'PAY_PAGE']
        ];

        $payloadBase64 = base64_encode(json_encode($payload));
        $endpoint = "/pg/v1/pay";
        $checksum = hash('sha256', $payloadBase64 . $endpoint . $this->saltKey) . '###' . $this->saltIndex;

        $hosts = (strtolower($this->env) === 'uat')
            ? ['https://api-preprod.phonepe.com/apis/pg-sandbox']
            : $this->prodHosts;

        foreach ($hosts as $host) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'X-VERIFY' => $checksum,
                    'X-MERCHANT-ID' => $this->merchantId,
                    'X-CLIENT-VERSION' => '1'
                ])->timeout(10)->post($host . $endpoint, ['request' => $payloadBase64]);

                $data = $response->json();
                if ($response->successful() && ($data['success'] ?? false)) {
                    return [
                        'success' => true,
                        'redirect_url' => $data['data']['instrumentResponse']['redirectInfo']['url'],
                        'transaction_id' => $transactionId
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("PhonePe Manual Resilient Host Failed: $host");
            }
        }

        return ['success' => false, 'message' => 'Payment Gateway Error. Please try later.'];
    }

    public function processCallback($encodedResponse, $checksumHeader)
    {
        $calculatedChecksum = hash('sha256', $encodedResponse . $this->saltKey) . '###' . $this->saltIndex;
        if ($calculatedChecksum !== $checksumHeader) {
            return ['success' => false, 'message' => 'Checksum Mismatch'];
        }

        $response = json_decode(base64_decode($encodedResponse), true);
        return [
            'success' => $response['success'] ?? false,
            'transaction_id' => $response['data']['merchantTransactionId'] ?? null,
            'amount' => $response['data']['amount'] ?? 0,
            'raw' => $response
        ];
    }
}
