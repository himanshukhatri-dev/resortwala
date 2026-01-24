<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestPhonePe extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'phonepe:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test PhonePe Enterprise OAuth2 Token and Payment Initiation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $clientId = config('phonepe.client_id');
        $clientSecret = config('phonepe.client_secret');
        $merchantId = config('phonepe.merchant_id');
        $env = config('phonepe.env');

        $this->info("Starting PhonePe Test for Merchant: $merchantId ($env)");
        $this->info("Client ID: $clientId");

        if (empty($clientId) || empty($clientSecret)) {
            $this->error("Client ID or Secret missing in configuration.");
            return;
        }

        // 1. Generate Access Token
        $this->comment("Phase 1: Generating Access Token...");

        $tokenUrl = $env === 'PROD'
            ? 'https://api.phonepe.com/apis/hermes/oauth/v1/token'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox/oauth/v1/token';

        try {
            $response = Http::asForm()->post($tokenUrl, [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'client_credentials',
            ]);

            if ($response->successful()) {
                $tokenData = $response->json();
                $accessToken = $tokenData['access_token'];
                $this->info("Token Generated Successfully!");
                $this->line("Access Token (first 20 chars): " . substr($accessToken, 0, 20) . "...");
            } else {
                $this->error("Token Generation Failed!");
                $this->error("Status: " . $response->status());
                $this->error("Body: " . $response->body());
                return;
            }

            // 2. Initiate Payment (₹1 Dummy)
            $this->comment("\nPhase 2: Initiating Payment (₹1)...");

            $payUrl = $env === 'PROD'
                ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
                : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

            $txnId = "TEST_" . time();
            $payload = [
                'merchantId' => $merchantId,
                'merchantTransactionId' => $txnId,
                'merchantUserId' => "TEST_USER_CLI",
                'amount' => 100, // ₹1
                'redirectUrl' => "https://resortwala.com/payment/test-success",
                'redirectMode' => 'REDIRECT',
                'callbackUrl' => "https://resortwala.com/api/phonepe/callback",
                'mobileNumber' => "9999999999",
                'paymentInstrument' => [
                    'type' => 'PAY_PAGE'
                ]
            ];

            $base64Payload = base64_encode(json_encode($payload));

            // Note: For Enterprise API, X-VERIFY is still often used along with the Bearer token
            // Checksum logic: base64(payload) + "/pg/v1/pay" + saltKey
            $saltKey = config('phonepe.salt_key');
            $saltIndex = config('phonepe.salt_index');
            $checksum = hash('sha256', $base64Payload . "/pg/v1/pay" . $saltKey) . "###" . $saltIndex;

            $payResponse = Http::withHeaders([
                'Authorization' => "Bearer $accessToken",
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $merchantId,
                'Content-Type' => 'application/json',
            ])->post($payUrl, [
                        'request' => $base64Payload
                    ]);

            if ($payResponse->successful()) {
                $payData = $payResponse->json();
                $this->info("Payment Initialized!");
                $this->line("Payment URL: " . ($payData['data']['instrumentResponse']['redirectInfo']['url'] ?? 'N/A'));
            } else {
                $this->warn("Payment Initiation Failed with Token. Retrying with Standard OAuth context if applicable...");
                $this->error("Status: " . $payResponse->status());
                $this->error("Body: " . $payResponse->body());
            }

        } catch (\Exception $e) {
            $this->error("Exception: " . $e->getMessage());
        }
    }
}
