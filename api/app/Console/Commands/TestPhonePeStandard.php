<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestPhonePeStandard extends Command
{
    protected $signature = 'phonepe:test-standard';
    protected $description = 'Test PhonePe Standard Checkout (Salt Key) Initiation';

    public function handle()
    {
        $mid = config('phonepe.merchant_id');
        $saltKey = config('phonepe.salt_key');
        $saltIndex = config('phonepe.salt_index');
        $env = config('phonepe.env');

        $this->info("--- PhonePe Standard Checkout Test ---");
        $this->line("Merchant ID: " . $mid);
        $this->line("Environment: " . $env);
        $this->line("Salt Index:  " . $saltIndex);

        if (empty($mid) || empty($saltKey)) {
            $this->error("Error: Configuration missing in .env (PHONEPE_MERCHANT_ID or PHONEPE_SALT_KEY)");
            return;
        }

        $endpoint = "/pg/v1/pay";
        $host = ($env === 'PROD') ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

        $payload = [
            'merchantId' => $mid,
            'merchantTransactionId' => "TEST_CLI_" . time(),
            'merchantUserId' => "CLI_USER_123",
            'amount' => 100, // ₹1
            'redirectUrl' => "https://resortwala.com/test",
            'redirectMode' => 'REDIRECT',
            'callbackUrl' => "https://resortwala.com/api/payment/callback",
            'mobileNumber' => "9999999999",
            'paymentInstrument' => ['type' => 'PAY_PAGE']
        ];

        $payloadBase64 = base64_encode(json_encode($payload));
        $checksum = hash('sha256', $payloadBase64 . $endpoint . $saltKey) . '###' . $saltIndex;

        $this->comment("\nAttempting initiation at: " . $host . $endpoint);

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $mid,
            ])->timeout(15)->post($host . $endpoint, ['request' => $payloadBase64]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['success'] ?? false) {
                    $this->info("✅ SUCCESS: Payment Link Generated!");
                    $this->line("URL: " . $data['data']['instrumentResponse']['redirectInfo']['url']);
                } else {
                    $this->error("❌ FAILED: PhonePe returned success=false");
                    $this->error("Code: " . ($data['code'] ?? 'N/A'));
                    $this->error("Message: " . ($data['message'] ?? 'N/A'));
                }
            } else {
                $this->error("❌ FAILED: HTTP Request Failed (" . $response->status() . ")");
                $this->error("Response: " . $response->body());
            }
        } catch (\Exception $e) {
            $this->error("❌ EXCEPTION: " . $e->getMessage());
        }

        $this->info("\n--- Test Complete ---");
    }
}
